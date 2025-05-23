'use client';

import { useState, useRef, ChangeEvent, useEffect, memo, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { createClient } from '../lib/supabase';
import ProfileHeader from '../components/ProfileHeader';
import PortfolioSection from '../components/PortfolioSection';
import SocialLinks from '../components/SocialLinks';
import Link from 'next/link';
import { Settings2, Trash2, X, Pencil, GripHorizontal, Plus } from 'lucide-react';
import { SavingIndicator } from '../components/SavingIndicator';

// Project interface
interface Project {
  id: string;
  projectLink: string;
  githubLink?: string;
  otherLink?: string;
  description: string;
  projectFavicon: string;
  githubFavicon?: string;
  otherFavicon?: string;
  title: string;
}

// Create a stable preview component that behaves like the title editing
const ProjectPreview = memo(({ url }: { url: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const [previewType, setPreviewType] = useState<'iframe' | 'meta' | 'error'>('iframe');
  const [metaPreview, setMetaPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
  }>({});

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const hostname = new URL(url).hostname;
        
        // Special handling for known platforms that block iframes
        const noIframePlatforms = [
          'github.com', 'www.github.com',
          'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
          'reddit.com', 'www.reddit.com',
          'youtube.com', 'www.youtube.com',
          'youtu.be', 'www.youtu.be'
        ];

        if (noIframePlatforms.includes(hostname)) {
          // Fetch meta data for preview
          try {
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + url);
            const html = await response.text();
            
            // Extract meta information
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
                          || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            
            // Try multiple image sources in order of preference
            let imageUrl;
            
            // First try Twitter image
            const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (twitterImageMatch) {
              imageUrl = twitterImageMatch[1];
            }
            
            // If no Twitter image, try OpenGraph image
            if (!imageUrl) {
              const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
              if (ogImageMatch) {
                imageUrl = ogImageMatch[1];
              }
            }

            // If still no image, try other meta image tags
            if (!imageUrl) {
              const metaImageMatch = html.match(/<meta[^>]*property=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
              if (metaImageMatch) {
                imageUrl = metaImageMatch[1];
              }
            }

            // Special handling for YouTube URLs
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
              const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
              if (videoId) {
                imageUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
              }
            }

            // Special handling for GitHub repositories
            if (hostname.includes('github.com')) {
              const repoMatch = url.match(/github\.com\/([^\/]+\/[^\/]+)/i);
              if (repoMatch) {
                imageUrl = `https://opengraph.githubassets.com/1/${repoMatch[1]}`;
              }
            }
            
            setMetaPreview({
              title: titleMatch ? titleMatch[1] : undefined,
              description: descMatch ? descMatch[1] : undefined,
              image: imageUrl
            });
            setPreviewType('meta');
          } catch {
            setPreviewError(true);
          }
        } else {
          setPreviewType('iframe');
        }
      } catch {
        setPreviewError(true);
      }
    };
    
    loadPreview();
  }, [url]);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling to card click
    window.open(url, '_blank');
  };

  if (previewError) {
    return (
      <div 
        className="absolute top-6 right-6 bottom-6 w-[162px] h-[108px] rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handlePreviewClick}
      >
        <p className="text-gray-400 text-xs text-center px-2">Preview not available</p>
      </div>
    );
  }

  if (previewType === 'meta') {
    return (
      <div 
        className="absolute top-6 right-6 bottom-6 w-[162px] h-[108px] rounded-xl border border-gray-200 overflow-hidden bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handlePreviewClick}
      >
        <div className="w-full h-full p-2 flex flex-col">
          {metaPreview.image ? (
            <div className="w-full h-full overflow-hidden rounded-t-lg bg-gray-50">
              <img src={metaPreview.image} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div className="flex-1 overflow-hidden p-1">
            {metaPreview.title && (
              <p className="text-[8px] font-medium line-clamp-2">{metaPreview.title}</p>
            )}
            {metaPreview.description && (
              <p className="text-[6px] text-gray-500 line-clamp-3 mt-0.5">{metaPreview.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute top-6 right-6 bottom-6 w-[162px] h-[108px] rounded-xl border border-gray-200 overflow-hidden bg-white cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handlePreviewClick}
    >
      <iframe
        ref={iframeRef}
        src={url}
        style={{
          transform: 'scale(0.10)',
          transformOrigin: '0 0',
          width: '1000%',
          height: '1000%',
          border: 'none',
          pointerEvents: 'none' // Prevent iframe from capturing clicks
        }}
        loading="lazy"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}, (prevProps, nextProps) => prevProps.url === nextProps.url);

// Move ProjectCard outside DashboardPage
const ProjectCard = memo(({ 
  project,
  onDelete,
  onEdit,
  onEditClick,
  isOwnProfile,
  supabase
}: { 
  project: Project;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void;
  onEditClick: (project: Project) => void;
  isOwnProfile: boolean;
  supabase: any;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(project.title);

  const handleTitleSave = useCallback(async (newTitle: string) => {
    if (!isOwnProfile) return; // Don't save if not owner
    
    const title = newTitle.trim() || localTitle;
    setLocalTitle(title);

    try {
      // Update title in database
      const { error } = await supabase
        .from('projects')
        .update({ title })
        .eq('id', project.id);

      if (error) throw error;

      // If database update successful, update local state
      const updatedProject = {
        ...project,
        title
      };
      onEdit(updatedProject);
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Error updating project title:', err);
    }
  }, [project, localTitle, onEdit, supabase, isOwnProfile]);

  const handleTitleEdit = useCallback((e: React.MouseEvent) => {
    if (!isOwnProfile) return; // Don't allow editing if not owner
    e.preventDefault();
    e.stopPropagation();
    setIsEditingTitle(true);
  }, [isOwnProfile]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't open the project if we're editing the title or clicking buttons
    if (
      isEditingTitle ||
      e.target instanceof Element && 
      (e.target.closest('button') || 
       e.target.closest('[data-link-square]') ||
       e.target.closest('input') ||
       e.target.closest('.title-edit-area'))
    ) {
      return;
    }
    window.open(project.projectLink, '_blank');
  }, [project.projectLink, isEditingTitle]);

  const handleLinkClick = useCallback((e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  }, []);

  const formatUrl = useCallback((url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }, []);

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-3xl p-6 cursor-pointer"
      style={{ height: '220px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {isOwnProfile && (
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 -left-2 text-gray-500 hover:text-black transition-colors duration-300 p-2 bg-white rounded-full shadow-sm hover:shadow-md z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                <Trash2 size={20} />
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 -right-2 text-gray-500 hover:text-black transition-colors duration-300 p-2 bg-white rounded-full shadow-sm hover:shadow-md z-10 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditClick(project);
                }}
              >
                <div className="p-0">
                  <Pencil size={20} />
                </div>
              </motion.button>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Favicons */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
          <img src={project.projectFavicon} alt="" className="w-12 h-12" />
        </div>
        {project.githubFavicon && (
          <div 
            className="w-6 h-6 mb-6 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
            onClick={(e) => handleLinkClick(e, project.githubLink!)}
            data-link-square="github"
          >
            <img src={project.githubFavicon} alt="" className="w-6 h-6" />
          </div>
        )}
        {project.otherFavicon && (
          <div 
            className="w-6 h-6 mb-6 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
            onClick={(e) => handleLinkClick(e, project.otherLink!)}
            data-link-square="other"
          >
            <img src={project.otherFavicon} alt="" className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mb-2 title-edit-area" style={{ width: 'calc(100% - 180px)' }} onClick={(e) => e.stopPropagation()}>
        {isEditingTitle && isOwnProfile ? (
          <input
            type="text"
            defaultValue={localTitle}
            onBlur={(e) => {
              e.stopPropagation();
              handleTitleSave(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleTitleSave(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                setIsEditingTitle(false);
              }
            }}
            className="text-lg font-bold w-full bg-transparent border-none outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 
            className={`text-lg font-bold truncate p-0 ${isOwnProfile ? 'cursor-text hover:bg-gray-100 rounded-lg transition-colors' : 'cursor-default'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isOwnProfile) {
                handleTitleEdit(e);
              }
            }}
            title={localTitle}
          >
            {localTitle}
          </h3>
        )}
      </div>

      {/* Project Link */}
      <div className="mb-2" style={{ width: 'calc(100% - 180px)' }}>
        <a 
          href={project.projectLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 block mb-2 text-xs truncate"
          onClick={e => e.stopPropagation()}
        >
          {formatUrl(project.projectLink)}
        </a>
      </div>

      {/* Description */}
      <div style={{ width: '100%' }} className="flex-grow">
        <p className="text-gray-500 text-xs leading-relaxed break-words overflow-hidden line-clamp-3">{project.description}</p>
      </div>

      {/* Preview */}
      <ProjectPreview url={project.projectLink} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Deep compare project objects, but exclude title from comparison
  const prevProject = prevProps.project;
  const nextProject = nextProps.project;
  return (
    prevProject.id === nextProject.id &&
    prevProject.projectLink === nextProject.projectLink &&
    prevProject.description === nextProject.description &&
    prevProject.projectFavicon === nextProject.projectFavicon &&
    prevProject.githubLink === nextProject.githubLink &&
    prevProject.githubFavicon === nextProject.githubFavicon &&
    prevProject.otherLink === nextProject.otherLink &&
    prevProject.otherFavicon === nextProject.otherFavicon &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onEditClick === nextProps.onEditClick
  );
});

// Helper to optimize and resize image data URL
const createOptimizedImageDataUrl = async (dataUrl: string, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = function () {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Use lower JPEG quality for avatar
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(dataUrl); // fallback
      }
    };
    img.onerror = function () {
      resolve(dataUrl); // fallback
    };
    img.src = dataUrl;
  });
};

// Debounce function for auto-saving
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Helper to create a 64x64 thumbnail data URL from an image data URL
const createFaviconFromDataUrl = async (dataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
            return;
      }

      const img = new window.Image();
      
      img.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.clearRect(0, 0, 64, 64);
          ctx.drawImage(img, 0, 0, 64, 64);
          
          try {
            const newDataUrl = canvas.toDataURL('image/png');
            resolve(newDataUrl);
          } catch (err) {
            console.warn('Error converting canvas to data URL:', err);
            resolve(dataUrl); // fallback to original
          }
        } catch (err) {
          console.warn('Error creating favicon canvas:', err);
          resolve(dataUrl); // fallback to original
        }
      };

      img.onerror = function (err) {
        console.warn('Error loading image for favicon:', err);
        resolve(dataUrl); // fallback to original
      };

      img.src = dataUrl;
    } catch (err) {
      console.warn('Error in createFaviconFromDataUrl:', err);
      resolve(dataUrl); // fallback to original
    }
  });
};

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  social_links?: {
    id: string;
    platform: 'github' | 'twitter' | 'linkedin' | 'website' | 'instagram' | 'youtube';
    url: string;
  }[];
  projects?: Project[];
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  console.log('ProfilePage render');
  
  const router = useRouter();
  const supabase = createClient();
  const supabasePublic = createClient();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Project modal states
  const [projectLink, setProjectLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [otherLink, setOtherLink] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectFavicon, setProjectFavicon] = useState('');
  const [githubFavicon, setGithubFavicon] = useState('');
  const [otherFavicon, setOtherFavicon] = useState('');
  
  // Social links modal states
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Array<{ url: string; favicon: string }>>([]);
  const [socialInputs, setSocialInputs] = useState<Array<{ url: string; favicon: string; isLoading?: boolean }>>([
    { url: '', favicon: '', isLoading: false },
    { url: '', favicon: '', isLoading: false },
    { url: '', favicon: '', isLoading: false },
    { url: '', favicon: '', isLoading: false },
    { url: '', favicon: '', isLoading: false }
  ]);
  
  // Add validation states
  const [projectLinkError, setProjectLinkError] = useState('');
  const [githubLinkError, setGithubLinkError] = useState('');
  const [otherLinkError, setOtherLinkError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [nameLines, setNameLines] = useState(1);

  // Store the default favicon URL
  const defaultFaviconRef = useRef<string | null>(null);

  // Add saving state
  const [isSaving, setIsSaving] = useState(false);

  // Add saving indicator timer ref
  const savingTimerRef = useRef<NodeJS.Timeout>();

  // Show saving indicator for 1 second
  const showSavingIndicator = useCallback(() => {
    setIsSaving(true);
    if (savingTimerRef.current) {
      clearTimeout(savingTimerRef.current);
    }
    savingTimerRef.current = setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  }, []);

  // Update saveChanges function to save to Supabase
  const saveChanges = useMemo(() => debounce(async (data: { name?: string; bio?: string; avatar?: string }) => {
    if (!profile) return;
    
    showSavingIndicator();
    
    try {
      // First update the database
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name !== undefined ? data.name : name,
          bio: data.bio !== undefined ? data.bio : bio,
          avatar_url: data.avatar !== undefined ? data.avatar : avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error saving to database:', error);
        throw error;
      }

      // If database update successful, update local state
      if (data.name !== undefined) setName(data.name);
      if (data.bio !== undefined) setBio(data.bio);
      if (data.avatar !== undefined) setAvatar(data.avatar);
      
      console.log('Successfully saved changes:', data);
    } catch (err) {
      console.error('Error saving changes:', err);
    }
  }, 500), [profile, name, bio, avatar, supabase, showSavingIndicator]);

  // Update handlers to show saving indicator
  const handleNameChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newLines = newValue.split('\n').length;
    
    // Calculate available bio lines
    const maxBioLines = 13 - (newLines - 1);
    
    // If bio needs to be trimmed, remove lines from bottom
    const currentBioLines = bio.split('\n');
    if (currentBioLines.length > maxBioLines) {
      const trimmedBio = currentBioLines.slice(0, maxBioLines).join('\n');
      setBio(trimmedBio);
      saveChanges({ bio: trimmedBio });
    }
    
    setName(newValue);
    setNameLines(newLines);
    saveChanges({ name: newValue });
    
    // Adjust textarea height
    if (nameTextareaRef.current) {
      nameTextareaRef.current.style.height = 'auto';
      nameTextareaRef.current.style.height = nameTextareaRef.current.scrollHeight + 'px';
    }
  };

  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const maxBioLines = 13 - (nameLines - 1);
    const newValue = e.target.value;
    const lines = newValue.split('\n');
    
    if (lines.length <= maxBioLines) {
      setBio(newValue);
      saveChanges({ bio: newValue });
      
      // Adjust textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Please choose an image under 5MB');
          return;
        }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        // Optimize the image before setting it
        const optimizedImage = await createOptimizedImageDataUrl(result, 400, 400); // Limit to 400x400
        setAvatar(optimizedImage);
        saveChanges({ avatar: optimizedImage });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    try {
      // Store current profile data in sessionStorage BEFORE any auth changes
      const tempData = {
        projects: projects || [],
        socialLinks: socialLinks || [],
        profile,
        name,
        bio,
        avatar,
        username: params.username // Store username to verify data ownership
      };
      console.log('Storing temp profile data before logout:', tempData);
      sessionStorage.setItem('tempProfileData', JSON.stringify(tempData));
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force a page refresh to show unauthorized view
      window.location.reload();
      
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
  };

  const handleAddProjectClick = () => {
    setShowAddProject(true);
  };

  const closeAddProject = () => {
    setShowAddProject(false);
    // Reset form
    setProjectLink('');
    setGithubLink('');
    setOtherLink('');
    setProjectDescription('');
  };

  const handleAddProject = async () => {
    if (!isFormValid() || !profile) return;

    const title = await getPageTitle(projectLink);
    const newProject: Project = {
      id: editingProject?.id || Date.now().toString(),
      projectLink,
      githubLink: githubLink || undefined,
      otherLink: otherLink || undefined,
      description: projectDescription,
      projectFavicon,
      githubFavicon: githubLink ? githubFavicon : undefined,
      otherFavicon: otherLink ? otherFavicon : undefined,
      title
    };

    try {
      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            title: newProject.title,
            description: newProject.description,
            link: newProject.projectLink,
            github_link: newProject.githubLink,
            other_link: newProject.otherLink,
            image_url: newProject.projectFavicon,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProject.id);

        if (error) throw error;

        setProjects(prev => prev.map(p => p.id === editingProject.id ? newProject : p));
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: profile.id,
            title: newProject.title,
            description: newProject.description,
            link: newProject.projectLink,
            github_link: newProject.githubLink,
            other_link: newProject.otherLink,
            image_url: newProject.projectFavicon
          })
          .select()
          .single();

        if (error) throw error;
        
        newProject.id = data.id;
        setProjects(prev => [newProject, ...prev]);
      }
      
      setEditingProject(null);
      closeAddProject();
      showSavingIndicator();
    } catch (err) {
      console.error('Error saving project:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteAvatar = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file upload click
    setAvatar(null);
    saveChanges({ avatar: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input
    }
  };

  // Add ref for name textarea
  const nameTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Effect to adjust name textarea height
  useEffect(() => {
    if (nameTextareaRef.current) {
      nameTextareaRef.current.style.height = 'auto';
      nameTextareaRef.current.style.height = nameTextareaRef.current.scrollHeight + 'px';
    }
  }, [name]);

  // Enhanced favicon fetching function
  const getFavicon = async (url: string): Promise<string> => {
    if (!url) return '';
    
    try {
      const domain = new URL(url).origin;
      const hostname = new URL(url).hostname;

      // Special handling for known platforms
      const knownPlatforms: { [key: string]: string } = {
        'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
        'www.github.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        'twitter.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        'www.twitter.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        'x.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        'www.x.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        'reddit.com': 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
        'www.reddit.com': 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
        'youtube.com': 'https://www.youtube.com/s/desktop/2ed914a0/img/logos/favicon_144x144.png',
        'www.youtube.com': 'https://www.youtube.com/s/desktop/2ed914a0/img/logos/favicon_144x144.png',
        'instagram.com': 'https://static.cdninstagram.com/rsrc.php/v4/yG/r/De-Dwpd5CHc.png',
        'www.instagram.com': 'https://static.cdninstagram.com/rsrc.php/v4/yG/r/De-Dwpd5CHc.png',
        'linkedin.com': 'https://static.licdn.com/aero-v1/sc/h/akt4ae504epesldzj74dzred8',
        'www.linkedin.com': 'https://static.licdn.com/aero-v1/sc/h/akt4ae504epesldzj74dzred8',
        'www.medium.com':'https://miro.medium.com/v2/resize:fill:1000:1000/7*GAOKVe--MXbEJmV9230oOQ.png',
        'medium.com':'https://miro.medium.com/v2/resize:fill:1000:1000/7*GAOKVe--MXbEJmV9230oOQ.png',
        'dribbble.com':'https://cdn.dribbble.com/assets/apple-touch-icon-precomposed-182fb6df572b99fd9f7c870e5bd4441188121518640c0fa57782b258434d1e0f.png',
        'www.dribbble.com':'https://cdn.dribbble.com/assets/apple-touch-icon-precomposed-182fb6df572b99fd9f7c870e5bd4441188121518640c0fa57782b258434d1e0f.png',
        'www.quora.com':'https://qsf.fs.quoracdn.net/-4-ans_frontend_assets.favicon-new.ico-26-e7e93fe0a7fbc991.ico',
        'quora.com':'https://qsf.fs.quoracdn.net/-4-ans_frontend_assets.favicon-new.ico-26-e7e93fe0a7fbc991.ico',
        'www.behance.net':'https://a5.behance.net/748594ab05d7795a0fdeb97b4e7655a1c85d5ba4/img/site/apple-touch-icon.png?cb=264615658',
        'behance.net':'https://a5.behance.net/748594ab05d7795a0fdeb97b4e7655a1c85d5ba4/img/site/apple-touch-icon.png?cb=264615658',
        'pinterest.com':'https://s.pinimg.com/webapp/logo_transparent_144x144-3da7a67b.png',
        'www.pinterest.com':'https://s.pinimg.com/webapp/logo_transparent_144x144-3da7a67b.png',
        'tumblr.com':'https://assets.tumblr.com/pop/manifest/apple-touch-icon-f8ea2554.png',
        'www.tumblr.com':'https://assets.tumblr.com/pop/manifest/apple-touch-icon-f8ea2554.png',
        'stackoverflow.com':'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v=c78bd457575a',
        'www.stackoverflow.com':'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png?v=c78bd457575a',
        'leetcode.com':'https://assets.leetcode.com/static_assets/public/icons/favicon-192x192.png',
        'www.leetcode.com/':'https://assets.leetcode.com/static_assets/public/icons/favicon-192x192.png',
        'loom.com':'https://cdn.loom.com/assets/favicons-loom/android-chrome-192x192.png',
        'www.loom.com':'https://cdn.loom.com/assets/favicons-loom/android-chrome-192x192.png',
        'calendly.com':'https://assets.calendly.com/assets/touch-icon-ipad-retina-260067382323ed52661bd79f4fa22edee49175d0d5b1cfc96cdc28eabbea159a.png',
        'www.calendly.com':'https://assets.calendly.com/assets/touch-icon-ipad-retina-260067382323ed52661bd79f4fa22edee49175d0d5b1cfc96cdc28eabbea159a.png',
        'www.figma.com':'https://static.figma.com/app/icon/1/icon-192.png',
        'figma.com':'https://static.figma.com/app/icon/1/icon-192.png',
        'colab.research.google.com':'https://colab.research.google.com/img/colab_favicon_256px.png',
        'www.colab.research.google.com':'https://colab.research.google.com/img/colab_favicon_256px.png',
        'drive.google.com':'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3RaendkWxwbnlsA8UyDPmcDbqIMQETxKYpw&s',
        'www.drive.google.com':'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3RaendkWxwbnlsA8UyDPmcDbqIMQETxKYpw&s',
        
        
        
        
        

      };

      if (knownPlatforms[hostname]) {
        return knownPlatforms[hostname];
      }

      // Try direct fetch first with CORS proxy
      try {
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const response = await fetch(corsProxy + url);
        const html = await response.text();
        
        // Extract all link tags
        const linkTags = html.match(/<link[^>]*>/gi) || [];
        console.log('Found link tags:', linkTags);

        // First try: Look for simple icon links
        for (const tag of linkTags) {
          // Look for the simplest icon tags first
          if (
            (tag.includes('rel="icon"') || tag.includes("rel='icon'") || 
             tag.includes('rel="apple-touch-icon"') || tag.includes("rel='apple-touch-icon'"))
            && !tag.includes('sizes=') && !tag.includes('type=')
          ) {
            const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
            if (hrefMatch) {
              let iconPath = hrefMatch[1];
              console.log('Found simple icon:', iconPath);
              
              // If it's not explicitly an ico file, use it
              if (!iconPath.endsWith('.ico')) {
                if (iconPath.startsWith('//')) {
                  iconPath = 'https:' + iconPath;
                } else if (iconPath.startsWith('/')) {
                  iconPath = domain + iconPath;
                } else if (!iconPath.startsWith('http')) {
                  iconPath = domain + '/' + iconPath;
                }
                console.log('Using simple icon:', iconPath);
                return iconPath;
              }
            }
          }
        }

        // Second try: Look for apple-touch-icon with PNG
        for (const tag of linkTags) {
          if (tag.includes('apple-touch-icon') && tag.includes('.png')) {
            const hrefMatch = tag.match(/href=["']([^"']+\.png)["']/i);
            if (hrefMatch) {
              let iconPath = hrefMatch[1];
              console.log('Found apple touch icon PNG:', iconPath);
              if (iconPath.startsWith('//')) {
                iconPath = 'https:' + iconPath;
              } else if (iconPath.startsWith('/')) {
                iconPath = domain + iconPath;
              } else if (!iconPath.startsWith('http')) {
                iconPath = domain + '/' + iconPath;
              }
              console.log('Using apple touch icon:', iconPath);
              return iconPath;
            }
          }
        }

        // Third try: Look for other high-quality image formats
        const imageIconRegex = /<link[^>]*rel=["'](?:[^"']*\s)?(?:icon|shortcut icon|apple-touch-icon|icon shortcut|fluid-icon|shortcut)(?:\s[^"']*)?["'][^>]*href=["']([^"']+\.(?:png|jpg|jpeg))["'][^>]*>/i;
        for (const tag of linkTags) {
          const match = tag.match(imageIconRegex);
          if (match) {
            let iconPath = match[1];
            console.log('Found image format icon:', iconPath);
            if (iconPath.startsWith('//')) {
              iconPath = 'https:' + iconPath;
            } else if (iconPath.startsWith('/')) {
              iconPath = domain + iconPath;
            } else if (!iconPath.startsWith('http')) {
              iconPath = domain + '/' + iconPath;
            }
            console.log('Using image format icon:', iconPath);
            return iconPath;
          }
        }

        // Fourth try: Look for SVG and ICO
        const otherIconRegex = /<link[^>]*rel=["'](?:[^"']*\s)?(?:icon|shortcut icon|apple-touch-icon)(?:\s[^"']*)?["'][^>]*href=["']([^"']+\.(?:svg|ico))["'][^>]*>/i;
        for (const tag of linkTags) {
          const match = tag.match(otherIconRegex);
          if (match) {
            let iconPath = match[1];
            if (iconPath.startsWith('//')) {
              iconPath = 'https:' + iconPath;
            } else if (iconPath.startsWith('/')) {
              iconPath = domain + iconPath;
            } else if (!iconPath.startsWith('http')) {
              iconPath = domain + '/' + iconPath;
            }
            return iconPath;
          }
        }

        // Priority ordered icon types
        const iconTypes = [
          'apple-touch-icon',
          'apple-touch-icon-precomposed',
          'shortcut icon',
          'icon shortcut',
          'icon',
          'fluid-icon',
          'mask-icon',
          'alternate icon',
          'shortcut',
          'favicon'
        ];
        
        // Size priority (prefer larger icons)
        const sizePriority = ['256', '192', '180', '152', '144', '128', '120', '96', '72', '64', '32', '16'];
        
        // Second try: Look for icons with sizes
        for (const size of sizePriority) {
          for (const type of iconTypes) {
            const regex = new RegExp(`<link[^>]*rel=["'](?:[^"']*\\s)?${type}(?:\\s[^"']*)?["'][^>]*sizes=["']${size}x${size}["'][^>]*>`, 'i');
            for (const tag of linkTags) {
              const match = tag.match(regex);
              if (match) {
                const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
                if (hrefMatch) {
                  let iconUrl = hrefMatch[1];
                  if (iconUrl.startsWith('//')) {
                    iconUrl = 'https:' + iconUrl;
                  } else if (iconUrl.startsWith('/')) {
                    iconUrl = domain + iconUrl;
                  } else if (!iconUrl.startsWith('http')) {
                    iconUrl = domain + '/' + iconUrl;
                  }
                  
                  try {
                    const iconResponse = await fetch(corsProxy + iconUrl);
                    if (iconResponse.ok) {
                      return iconUrl;
                    }
                  } catch {
                    continue;
                  }
                }
              }
            }
          }
        }
        
        // Third try: Look for any icon without size
        for (const type of iconTypes) {
          const regex = new RegExp(`<link[^>]*rel=["'](?:[^"']*\\s)?${type}(?:\\s[^"']*)?["'][^>]*>`, 'i');
          for (const tag of linkTags) {
            const match = tag.match(regex);
            if (match) {
              const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
              if (hrefMatch) {
                let iconUrl = hrefMatch[1];
                if (iconUrl.startsWith('//')) {
                  iconUrl = 'https:' + iconUrl;
                } else if (iconUrl.startsWith('/')) {
                  iconUrl = domain + iconUrl;
                } else if (!iconUrl.startsWith('http')) {
                  iconUrl = domain + '/' + iconUrl;
                }
                
                try {
                  const iconResponse = await fetch(corsProxy + iconUrl);
                  if (iconResponse.ok) {
                    return iconUrl;
                  }
                } catch {
                  continue;
                }
              }
            }
          }
        }
      } catch {
        // If HTML parsing fails, continue to fallbacks
      }
      
      // Try common paths, prioritizing image formats
      const commonPaths = [
        '/apple-touch-icon.png',
        '/favicon.png',
        '/favicon.jpg',
        '/favicon.jpeg',
        '/favicon.svg',
        '/favicon.ico',
      ];
      
      for (const path of commonPaths) {
        try {
          const response = await fetch(domain + path);
          if (response.ok) {
            return domain + path;
          }
        } catch {
          continue;
        }
      }
      
      // Service-based fallbacks
      const fallbackUrls = [
        `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
        `https://icon.horse/icon/${hostname}`,
        `https://favicons.githubusercontent.com/${hostname}`,
        `https://api.faviconkit.com/${hostname}/64`,
        `https://icons.duckduckgo.com/ip2/${hostname}.ico`
      ];

      for (const fallbackUrl of fallbackUrls) {
        try {
          const response = await fetch(fallbackUrl);
          if (response.ok) {
            return fallbackUrl;
          }
        } catch {
          continue;
        }
      }
      
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      
    } catch {
      return '';
    }
  };

  // Separate useEffect for each link to avoid interference
  useEffect(() => {
    let isMounted = true;

    const fetchFavicon = async () => {
      if (projectLink) {
        const favicon = await getFavicon(projectLink);
        if (isMounted) {
          setProjectFavicon(favicon);
        }
      } else {
        setProjectFavicon('');
      }
    };

    fetchFavicon();
    return () => {
      isMounted = false;
    };
  }, [projectLink]);

  useEffect(() => {
    let isMounted = true;

    const fetchFavicon = async () => {
      if (githubLink) {
        const favicon = await getFavicon(githubLink);
        if (isMounted) {
          setGithubFavicon(favicon);
        }
      } else {
        setGithubFavicon('');
      }
    };

    fetchFavicon();
    return () => {
      isMounted = false;
    };
  }, [githubLink]);

  useEffect(() => {
    let isMounted = true;

    const fetchFavicon = async () => {
      if (otherLink) {
        const favicon = await getFavicon(otherLink);
        if (isMounted) {
          setOtherFavicon(favicon);
        }
      } else {
        setOtherFavicon('');
      }
    };

    fetchFavicon();
    return () => {
      isMounted = false;
    };
  }, [otherLink]);

  // Validate URL function
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (err) {
      return false;
    }
  };

  // Check if form is valid (all filled links must be valid)
  const isFormValid = (): boolean => {
    if (!projectLink || !isValidUrl(projectLink)) return false;
    if (githubLink && !isValidUrl(githubLink)) return false;
    if (otherLink && !isValidUrl(otherLink)) return false;
    if (isFaviconLoading) return false;
    if (!projectFavicon) return false;
    return true;
  };

  // Handle link changes with validation
  const handleLinkChange = (
    value: string,
    setter: (value: string) => void,
    errorSetter: (error: string) => void
  ) => {
    setter(value);
    if (value && !isValidUrl(value)) {
      errorSetter('Please enter a valid URL');
    } else {
      errorSetter('');
    }
  };

  // Function to get page title
  const getPageTitle = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const match = html.match(/<title>(.*?)<\/title>/i);
      return match ? match[1] : new URL(url).hostname;
    } catch {
      return new URL(url).hostname;
    }
  };

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      // Delete from database first
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // If database delete successful, update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      showSavingIndicator();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  }, [showSavingIndicator]);

  const handleEditProject = useCallback((project: Project) => {
    if (project.id === editingProject?.id) {
      // If it's just a title update
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      showSavingIndicator();
    } else {
      // If it's opening the edit modal
      setEditingProject(project);
      setProjectLink(project.projectLink);
      setGithubLink(project.githubLink || '');
      setOtherLink(project.otherLink || '');
      setProjectDescription(project.description);
      setProjectFavicon(project.projectFavicon);
      setGithubFavicon(project.githubFavicon || '');
      setOtherFavicon(project.otherFavicon || '');
      setShowAddProject(true);
    }
  }, [editingProject, showSavingIndicator]);

  // Track projects array changes
  useEffect(() => {
    console.log('Projects array changed:', projects);
  }, [projects]);

  // Track profile changes
  useEffect(() => {
    console.log('Profile changed:', { avatar, name, bio });
  }, [avatar, name, bio]);

  // Add/Edit Project Modal
  const [isFaviconLoading, setIsFaviconLoading] = useState(false);

  const handleProjectLinkChange = async (value: string) => {
    setProjectLink(value);
    setProjectLinkError('');
    
    if (value && isValidUrl(value)) {
      setIsFaviconLoading(true);
      try {
        const favicon = await getFavicon(value);
        setProjectFavicon(favicon);
      } finally {
        setIsFaviconLoading(false);
      }
    } else {
      setProjectFavicon('');
    }
  };

  // Function to check if social inputs have changed
  const haveSocialInputsChanged = useCallback(() => {
    const currentValidInputs = socialInputs.filter(input => input.url && input.favicon);
    
    // If we're removing all links, that's a valid change
    if (socialLinks.length > 0 && currentValidInputs.length === 0) {
      return true;
    }

    // If lengths are different, there's a change
    if (socialLinks.length !== currentValidInputs.length) {
      return true;
    }

    // Check if any existing links have been modified
    return currentValidInputs.some((input, index) => {
      const existingLink = socialLinks[index];
      return !existingLink || input.url !== existingLink.url;
    });
  }, [socialLinks, socialInputs]);

  // Social links handlers
  const handleSocialLinkChange = async (value: string, index: number) => {
    const newInputs = [...socialInputs];
    newInputs[index] = { ...newInputs[index], url: value, isLoading: true };
    setSocialInputs(newInputs);
    
    if (value && isValidUrl(value)) {
      try {
        const favicon = await getFavicon(value);
        newInputs[index] = { ...newInputs[index], favicon, isLoading: false };
        setSocialInputs([...newInputs]);
      } catch {
        newInputs[index] = { ...newInputs[index], favicon: '', isLoading: false };
        setSocialInputs([...newInputs]);
      }
    } else {
      newInputs[index] = { ...newInputs[index], favicon: '', isLoading: false };
      setSocialInputs([...newInputs]);
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    const newInputs = [...socialInputs];
    newInputs[index] = { url: '', favicon: '', isLoading: false };
    setSocialInputs(newInputs);
  };

  const handleSaveSocials = async () => {
    try {
      // Filter out empty inputs but keep the order
      const validSocials = socialInputs.filter(input => input.url && input.favicon);
      
      if (!profile?.id) return;

      // First, delete all existing social links for this user
      const { error: deleteError } = await supabase
        .from('social_links')
        .delete()
        .eq('user_id', profile.id);

      if (deleteError) throw deleteError;

      // Then insert the new social links
      if (validSocials.length > 0) {
        const { error: insertError } = await supabase
          .from('social_links')
          .insert(
            validSocials.map(social => ({
              user_id: profile.id,
              url: social.url,
              platform: 'website' as const, // Type assertion to match the enum
            }))
          );

        if (insertError) throw insertError;
      }

      // Update local state
      setSocialLinks(validSocials);
      setShowSocialLinks(false);
      showSavingIndicator();
    } catch (error: any) {
      console.error('Error saving social links:', error);
    }
  };

  const handleSocialClick = (url: string) => {
    window.open(url, '_blank');
  };

  // Effect to initialize socialInputs with existing links when modal opens
  useEffect(() => {
    if (showSocialLinks) {
      // Create new array with 5 empty slots
      const newInputs = Array(5).fill({ url: '', favicon: '', isLoading: false });
      // Fill in existing links
      socialLinks.forEach((link, index) => {
        newInputs[index] = { ...link, isLoading: false };
      });
      setSocialInputs(newInputs);
    }
  }, [showSocialLinks]);

  // Set favicon helper (removes all existing favicon tags, adds new one)
  const setFavicon = useCallback((url: string) => {
    try {
      // Only run in browser environment and if document is ready
      if (typeof document === 'undefined' || !document.head) return;

      // Safely remove existing favicons
      const links = Array.from(document.head.querySelectorAll("link[rel*='icon']"));
      links.forEach(link => {
        try {
          if (link && link.parentNode) {
            link.parentNode.removeChild(link);
          }
        } catch (err) {
          console.warn('Error removing old favicon:', err);
        }
      });

      try {
        // Add new favicon
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = url;
        document.head?.appendChild(newLink);
      } catch (err) {
        console.warn('Error adding new favicon:', err);
      }
    } catch (error) {
      console.warn('Error updating favicon:', error);
    }
  }, []);

  // On mount, store the default favicon and handle cleanup
  useEffect(() => {
    // Only run in browser environment
    if (typeof document === 'undefined' || !document.head) return;

    // Store default favicon
    const link = document.head.querySelector("link[rel*='icon']");
    if (link) {
      defaultFaviconRef.current = link.getAttribute('href');
    }

    // Cleanup function
    return () => {
      if (defaultFaviconRef.current && document.head) {
        try {
          setFavicon(defaultFaviconRef.current);
        } catch (err) {
          console.warn('Error restoring default favicon:', err);
        }
      }
    };
  }, []);

  // Update favicon when avatar changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (avatar && typeof document !== 'undefined' && document.head) {
      timeoutId = setTimeout(async () => {
        try {
          const faviconUrl = await createFaviconFromDataUrl(avatar);
          if (document.head) { // Double check document.head exists
            setFavicon(faviconUrl);
          }
        } catch (error) {
          console.warn('Error creating favicon:', error);
          if (defaultFaviconRef.current && document.head) {
            setFavicon(defaultFaviconRef.current);
          }
        }
      }, 1000);
    } else if (defaultFaviconRef.current && typeof document !== 'undefined' && document.head) {
      setFavicon(defaultFaviconRef.current);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Restore default favicon on cleanup if it exists
      if (defaultFaviconRef.current && typeof document !== 'undefined' && document.head) {
        try {
          setFavicon(defaultFaviconRef.current);
        } catch (err) {
          console.warn('Error restoring default favicon on cleanup:', err);
        }
      }
    };
  }, [avatar, setFavicon]);

  // Update page title when name changes
  useEffect(() => {
    document.title = name || 'Superfolio';
  }, [name]);

  // Effect to determine if user is viewing their own profile
  useEffect(() => {
    const checkSession = async () => {
      console.log('Checking session...');
      
      // Get Supabase session
      const { data: { session: supaSession } } = await supabase.auth.getSession();
      console.log('Supabase session:', supaSession);
      console.log('URL username:', params.username);

      if (supaSession?.user?.user_metadata?.username === params.username) {
        console.log('Setting isOwnProfile to true - matched session');
        setIsOwnProfile(true);
      } else {
        console.log('Setting isOwnProfile to false - no session match');
        setIsOwnProfile(false);
      }
    };

    checkSession();
  }, [params.username]);

  // Effect to fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!params.username) {
        console.log('No username in params');
        return;
      }
      
      console.log('Fetching profile for:', params.username);
      setLoading(true);
      try {
        // Get the user data using public client
        const { data: userData, error: userError } = await supabasePublic
          .from('users')
          .select('*')
          .eq('username', params.username)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          throw userError;
        }
        if (!userData) {
          console.error('User not found');
          throw new Error('User not found');
        }

        console.log('Found user data:', userData);

        // Set basic profile data
        setProfile(userData);
        setName(userData.name || '');
        setBio(userData.bio || '');
        setAvatar(userData.avatar_url || null);

        // Check if user is owner of profile
        const { data: { session } } = await supabase.auth.getSession();
        const isOwner = session?.user?.id === userData.id;
        setIsOwnProfile(isOwner);

        // Always fetch fresh data for projects
        console.log('Fetching projects from Supabase');
        const { data: projectsData, error: projectsError } = await supabasePublic
          .from('projects')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          throw projectsError;
        }
        console.log('Found projects:', projectsData);

        // Transform projects
        const finalProjects = await Promise.all((projectsData || []).map(async p => ({
          id: p.id,
          title: p.title || '',
          description: p.description || '',
          projectLink: p.link || '',
          githubLink: p.github_link || undefined,
          otherLink: p.other_link || undefined,
          projectFavicon: p.image_url || await getFavicon(p.link),
          githubFavicon: p.github_link ? await getFavicon(p.github_link) : undefined,
          otherFavicon: p.other_link ? await getFavicon(p.other_link) : undefined
        })));

        // Always fetch fresh data for social links
        console.log('Fetching social links from Supabase');
        const { data: socialsData, error: socialsError } = await supabasePublic
          .from('social_links')
          .select('*')
          .eq('user_id', userData.id);

        if (socialsError) {
          console.error('Error fetching social links:', socialsError);
          throw socialsError;
        }
        console.log('Found social links:', socialsData);

        // Transform social links
        const finalSocialLinks = await Promise.all(
          (socialsData || []).map(async (link: { url: string }) => ({
            url: link.url,
            favicon: await getFavicon(link.url)
          }))
        );

        console.log('Setting final projects:', finalProjects);
        console.log('Setting final social links:', finalSocialLinks);
        setProjects(finalProjects);
        setSocialLinks(finalSocialLinks);

        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        // Reset states on error
        setProfile(null);
        setProjects([]);
        setSocialLinks([]);
      } finally {
        setLoading(false);
        setMounted(true);
      }
    };

    fetchProfile();
  }, [params.username]);

  // Add a handler for login navigation
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use router for navigation without manipulating favicons
    window.location.href = '/login';
  };

  // Add state for logged-in user's username
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);

  // Add effect to check logged-in user
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.username) {
        setLoggedInUsername(session.user.user_metadata.username);
      }
    };
    checkLoggedInUser();
  }, []);

    return (
    <div className="h-screen bg-white p-8 overflow-hidden pt-12 px-12">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="max-w-full mx-auto flex h-full">
          {/* Left Side: Profile Section */}
          <div className="w-[400px] flex-shrink-0">
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div 
                onClick={isOwnProfile ? handleAvatarClick : undefined}
                className={`w-48 h-48 rounded-full ${!avatar ? 'border-2 border-dashed border-gray-300' : ''} 
                         flex items-center justify-center relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
              >
                {avatar ? (
                  <>
                    <div className="w-full absolute inset-0">
                      <Image
                        src={avatar}
                        alt="Profile"
                        width={192}
                        height={192}
                        className="object-cover w-full h-full rounded-full"
                      />
                    </div>
                    {isOwnProfile && (
                      <div className="mt-32 flex justify-center ml-32 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={handleDeleteAvatar}
                          className="bg-white p-2 rounded-full text-gray-500 hover:text-black shadow-md transition-colors duration-300"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 text-md font-bold group-hover:scale-105 transition-transform duration-200">
                    {isOwnProfile ? 'Add avatar' : ''}
                  </span>
                )}
                {isOwnProfile && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                )}
              </div>

              {/* Name Input */}
              <div>
                <textarea
                  ref={nameTextareaRef}
                  value={name}
                  onChange={handleNameChange}
                  placeholder={isOwnProfile ? "Your name" : ""}
                  rows={1}
                  readOnly={!isOwnProfile}
                  className={`text-3xl font-bold w-full bg-transparent border-none outline-none resize-none overflow-hidden
                           placeholder:text-gray-300 ${!isOwnProfile ? 'cursor-default' : ''}`}
                />
              </div>

              {/* Bio Input */}
              <div className="flex-grow">
                <textarea
                  ref={textareaRef}
                  value={bio}
                  onChange={handleBioChange}
                  placeholder={isOwnProfile ? "About you..." : ""}
                  readOnly={!isOwnProfile}
                  className={`text-xl w-full bg-transparent border-none outline-none resize-none overflow-hidden min-h-[2.5rem]
                           placeholder:text-gray-300 ${!isOwnProfile ? 'cursor-default' : ''}`}
                  onKeyDown={(e) => {
                    if (!isOwnProfile) return;
                    const maxBioLines = 13 - (nameLines - 1);
                    if (e.key === 'Enter' && bio.split('\n').length >= maxBioLines) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Side: Projects Section */}
          <div className="flex-grow pl-0 flex flex-col h-full">
            {/* Add Project Button */}
            <div className="flex justify-end mb-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Social Icons */}
                {socialLinks.map((social, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSocialClick(social.url)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-colors"
                  >
                    <img src={social.favicon} alt="" className="w-12 h-12" />
                  </div>
                ))}
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowSocialLinks(true)}
                    className="bg-[#0085ff] text-white font-bold px-6 py-3 rounded-2xl 
                             hover:bg-[#2999ff] transition-colors duration-300 mr-4"
                  >
                    {socialLinks.length > 0 ? 'Edit Socials' : 'Add Socials'}
                  </button>
                )}
              </div>
              {isOwnProfile && (
                <button 
                  onClick={handleAddProjectClick}
                  className="bg-[#0085ff] text-white font-bold px-6 py-3 rounded-2xl 
                           hover:bg-[#2999ff] transition-colors duration-300"
                >
                  Add Project
                </button>
              )}
            </div>

            {/* Projects Grid - Scrollable */}
            <div className="pr-0 flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <motion.div
                className="grid grid-cols-2 gap-6 relative pb-6" 
                style={{ 
                  gridTemplateColumns: "repeat(2, 400px)",
                  justifyContent: "end",
                  columnGap: "28px"
                }}
                layout
              >
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 1}}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0}}
                    layout
                    layoutId={project.id}
                    className="w-[400px]"
                  >
                    <ProjectCard 
                      project={project}
                      onDelete={handleDeleteProject}
                      onEdit={handleEditProject}
                      isOwnProfile={isOwnProfile}
                      supabase={supabase}
                      onEditClick={(project) => {
                        if (!isOwnProfile || document.activeElement?.tagName.toLowerCase() === 'input') return;
                        setShowAddProject(true);
                        setEditingProject(project);
                        setProjectLink(project.projectLink);
                        setGithubLink(project.githubLink || '');
                        setOtherLink(project.otherLink || '');
                        setProjectDescription(project.description);
                        setProjectFavicon(project.projectFavicon);
                        setGithubFavicon(project.githubFavicon || '');
                        setOtherFavicon(project.otherFavicon || '');
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
              </div>
              </div>
        </div>
      )}

      {/* Settings, Saving Indicator and Logout */}
      <div className="absolute top-4 right-12 flex items-center gap-4">
        <AnimatePresence mode="wait">
          {isSaving && isOwnProfile && <SavingIndicator />}
        </AnimatePresence>
        {isOwnProfile ? (
          <>
            {showLogout && (
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-black transition-colors px-2 py-1 rounded-lg border border-gray-200"
              >
                logout
              </button>
            )}
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="text-gray-500 hover:text-black transition-colors"
            >
              <Settings2 size={20} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            {/* Show My Superfolio link if user is logged in but viewing another profile */}
            {loggedInUsername && (
              <Link
                href={`/${loggedInUsername}`}
                className="text-xs text-gray-500 hover:text-black transition-colors px-2 py-1 rounded-lg border border-gray-200"
              >
                My Superfolio
              </Link>
            )}
            {!loggedInUsername && (
              <Link
                href="/login"
                onClick={handleLoginClick}
                className="text-xs text-gray-500 hover:text-black transition-colors px-2 py-1 rounded-lg border border-gray-200"
              >
                log in
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      <AnimatePresence>
        {showAddProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-25 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 w-[500px] relative"
            >
              {/* Delete/Close Button */}
              <button
                onClick={closeAddProject}
                className="absolute top-6 left-6 text-gray-500 hover:text-black transition-colors duration-300"
              >
                <X size={24} />
              </button>

              {/* Form Fields */}
              <div className="space-y-6 mt-8">
                {/* Project Link */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={projectLink}
                        onChange={(e) => handleProjectLinkChange(e.target.value)}
                        placeholder="Project link/ live demo link*"
                        className="w-full p-4 rounded-2xl border border-gray-200 outline-none transition-colors"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                      {isFaviconLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                      ) : projectFavicon ? (
                        <img src={projectFavicon} alt="" className="w-12 h-12" />
                      ) : null}
                    </div>
                  </div>
                  {projectLinkError && (
                    <p className="absolute -bottom-5 left-1 text-red-500 text-sm">{projectLinkError}</p>
                  )}
                </div>

                {/* Github Link */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={githubLink}
                        onChange={(e) => handleLinkChange(e.target.value, setGithubLink, setGithubLinkError)}
                        placeholder="Github link/ code repository link"
                        className="w-full p-4 rounded-2xl border border-gray-200 outline-none transition-colors"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                      {githubFavicon && (
                        <img src={githubFavicon} alt="" className="w-12 h-12" />
                      )}
                    </div>
                  </div>
                  {githubLinkError && (
                    <p className="absolute -bottom-5 left-1 text-red-500 text-sm">{githubLinkError}</p>
                  )}
                </div>

                {/* Other Link */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={otherLink}
                        onChange={(e) => handleLinkChange(e.target.value, setOtherLink, setOtherLinkError)}
                        placeholder="Any other link"
                        className="w-full p-4 rounded-2xl border border-gray-200 outline-none transition-colors"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                      {otherFavicon && (
                        <img src={otherFavicon} alt="" className="w-12 h-12" />
                      )}
                    </div>
                  </div>
                  {otherLinkError && (
                    <p className="absolute -bottom-5 left-1 text-red-500 text-sm">{otherLinkError}</p>
                  )}
                </div>

                {/* Project Description */}
                <div className="relative">
                  <textarea
                    value={projectDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= 195) {
                        setProjectDescription(e.target.value);
                      }
                    }}
                    placeholder="A short bio about the project"
                    className="w-full p-4 rounded-2xl border border-gray-200 outline-none transition-colors resize-none h-36"
                  />
                  <span className="absolute bottom-4 right-4 text-sm text-gray-400">
                    {projectDescription.length}/195
                  </span>
                </div>
              </div>

              {/* Updated buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={editingProject ? handleAddProject : handleAddProject}
                  disabled={!isFormValid()}
                  className={`font-bold px-8 py-3 rounded-2xl transition-colors duration-300 ${
                    isFormValid()
                      ? 'bg-[#0085ff] text-white hover:bg-[#2999ff]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {editingProject ? 'Save' : 'Add'}
              </button>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Links Modal */}
      <AnimatePresence>
        {showSocialLinks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-25 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 w-[500px] relative"
            >
              {/* Close Button */}
            <button
                onClick={() => setShowSocialLinks(false)}
                className="absolute top-6 left-6 text-gray-500 hover:text-black transition-colors duration-300"
              >
                <X size={24} />
            </button>

              {/* Title */}
              <h2 className="text-md font-bold text-left mb-6 mt-6">
                {socialLinks.length > 0 ? 'Edit Your Links' : 'You can add your Social Links, Music Playlist, Resume, or anything else you want to share with the world!'}
              </h2>

              {/* Form Fields */}
              <div className="space-y-6 mt-8">
                {socialInputs.map((input, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-grow relative">
                        <input
                          type="text"
                          value={input.url}
                          onChange={(e) => handleSocialLinkChange(e.target.value, index)}
                          placeholder={`Social link ${index + 1}`}
                          className="w-full p-4 rounded-2xl border border-gray-200 outline-none transition-colors"
                        />
                        {input.url && (
                          <button
                            onClick={() => handleRemoveSocialLink(index)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                      <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                        {input.isLoading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                        ) : input.favicon ? (
                          <img src={input.favicon} alt="" className="w-12 h-12" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveSocials}
                  className={`font-bold px-8 py-3 rounded-2xl transition-colors duration-300 ${
                    haveSocialInputsChanged() && !socialInputs.some(input => input.isLoading)
                      ? 'bg-[#0085ff] text-white hover:bg-[#2999ff]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!haveSocialInputsChanged() || socialInputs.some(input => input.isLoading)}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 