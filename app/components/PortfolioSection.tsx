import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}

interface PortfolioSectionProps {
  projects: Project[];
  isOwnProfile: boolean;
  onAddProject?: () => void;
  onDeleteProject?: (id: string) => void;
  onEditProject?: (project: Project) => void;
}

export default function PortfolioSection({
  projects,
  isOwnProfile,
  onAddProject,
  onDeleteProject,
  onEditProject
}: PortfolioSectionProps) {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        {isOwnProfile && (
          <button
            onClick={onAddProject}
            className="flex items-center gap-2 px-4 py-2 bg-[#0085ff] text-white 
                     rounded-full hover:bg-[#2999ff] transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-600">
            {isOwnProfile 
              ? "You haven't added any projects yet. Click 'Add Project' to get started!"
              : "No projects added yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group relative bg-white rounded-xl overflow-hidden shadow-sm 
                       hover:shadow-md transition-shadow duration-200"
            >
              {/* Project Image */}
              <div className="relative aspect-video">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      View Project
                    </a>
                  )}
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject?.(project);
                        }}
                        className="text-white font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject?.(project.id);
                        }}
                        className="text-red-400 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{project.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 