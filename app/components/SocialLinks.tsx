import { Github, Twitter, Linkedin, Globe, Instagram, Youtube, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface SocialLink {
  id: string;
  platform: 'github' | 'twitter' | 'linkedin' | 'website' | 'instagram' | 'youtube';
  url: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  isOwnProfile?: boolean;
  onShowSocialLinks?: () => void;
  onSocialClick?: (url: string) => void;
}

const platformIcons = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  website: Globe,
  instagram: Instagram,
  youtube: Youtube,
};

const platformColors = {
  github: 'hover:bg-gray-900',
  twitter: 'hover:bg-[#1DA1F2]',
  linkedin: 'hover:bg-[#0A66C2]',
  website: 'hover:bg-[#0085ff]',
  instagram: 'hover:bg-[#E4405F]',
  youtube: 'hover:bg-[#FF0000]',
};

export default function SocialLinks({ 
  links,
  isOwnProfile,
  onShowSocialLinks,
  onSocialClick
}: SocialLinksProps) {
  if (links.length === 0 && !isOwnProfile) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {links.map((link, index) => {
        const Icon = platformIcons[link.platform];
        const hoverColor = platformColors[link.platform];

        return (
          <motion.button
            key={link.id}
            onClick={() => onSocialClick?.(link.url)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
            className={`p-2 rounded-full bg-gray-100 ${hoverColor} hover:text-white 
                      transition-colors duration-200`}
            title={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
          >
            <Icon className="w-5 h-5" />
          </motion.button>
        );
      })}
      {isOwnProfile && (
        <motion.button
          onClick={onShowSocialLinks}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: links.length * 0.1 }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 
                   transition-colors duration-200"
          title="Add social links"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
} 