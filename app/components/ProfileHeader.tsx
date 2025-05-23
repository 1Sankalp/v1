import Image from 'next/image';
import { Camera, Edit2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChangeEvent, RefObject } from 'react';

interface ProfileHeaderProps {
  username: string;
  isOwnProfile: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  name?: string;
  bio?: string;
  onEditProfile?: () => void;
  onNameChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBioChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onAvatarClick?: () => void;
  onDeleteAvatar?: (e: React.MouseEvent) => void;
  nameTextareaRef?: RefObject<HTMLTextAreaElement>;
}

export default function ProfileHeader({
  username,
  isOwnProfile,
  avatarUrl = '/default-avatar.png',
  coverUrl = '/default-cover.jpg',
  name,
  bio,
  onEditProfile,
  onNameChange,
  onBioChange,
  onAvatarClick,
  onDeleteAvatar,
  nameTextareaRef
}: ProfileHeaderProps) {
  return (
    <div className="relative w-full">
      {/* Cover Photo */}
      <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden">
        <Image
          src={coverUrl}
          alt="Cover photo"
          fill
          className="object-cover"
          priority
        />
        {isOwnProfile && (
          <button 
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white 
                     rounded-full p-2 transition-colors duration-200"
            aria-label="Change cover photo"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 pb-4 -mt-16 md:-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-white"
                onClick={isOwnProfile ? onAvatarClick : undefined}
                style={isOwnProfile ? { cursor: 'pointer' } : undefined}
              >
                <Image
                  src={avatarUrl}
                  alt="Profile picture"
                  fill
                  className="object-cover"
                  priority
                />
                {isOwnProfile && (
                  <>
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    {avatarUrl !== '/default-avatar.png' && (
                      <button
                        onClick={onDeleteAvatar}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white 
                                rounded-full p-1.5 transition-colors duration-200 z-10"
                        aria-label="Remove profile picture"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isOwnProfile ? (
                    <motion.textarea
                      ref={nameTextareaRef}
                      value={name || ''}
                      onChange={onNameChange}
                      placeholder={`@${username}`}
                      className="w-full text-2xl md:text-3xl font-bold bg-transparent resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 -ml-2"
                      rows={1}
                      style={{ minHeight: '2.5rem' }}
                    />
                  ) : (
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="text-2xl md:text-3xl font-bold"
                    >
                      {name || `@${username}`}
                    </motion.h1>
                  )}
                  {name && (
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-gray-600 mt-1"
                    >
                      @{username}
                    </motion.p>
                  )}
                </div>
                {isOwnProfile && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    onClick={onEditProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                             rounded-full transition-colors duration-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </motion.button>
                )}
              </div>
              {isOwnProfile ? (
                <motion.textarea
                  value={bio || ''}
                  onChange={onBioChange}
                  placeholder="Write a bio..."
                  className="mt-4 w-full text-gray-600 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 -ml-2"
                  rows={1}
                  style={{ minHeight: '1.5rem' }}
                />
              ) : bio ? (
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="mt-4 text-gray-600 max-w-2xl"
                >
                  {bio}
                </motion.p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 