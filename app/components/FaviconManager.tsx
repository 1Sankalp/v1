import { useEffect, useRef } from 'react';

interface FaviconManagerProps {
  avatar: string | null;
}

export const FaviconManager = ({ avatar }: FaviconManagerProps) => {
  const defaultFaviconRef = useRef<string | null>(null);
  const isMounted = useRef(false);

  // Store default favicon on mount
  useEffect(() => {
    isMounted.current = true;
    
    if (typeof window === 'undefined') return;
    
    // Wait for document to be ready
    if (!document?.head) {
      const timer = setInterval(() => {
        if (document?.head) {
          clearInterval(timer);
          storeDefaultFavicon();
        }
      }, 100);
      return () => clearInterval(timer);
    } else {
      storeDefaultFavicon();
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const storeDefaultFavicon = () => {
    try {
      const link = document.querySelector("link[rel*='icon']");
      if (link) {
        defaultFaviconRef.current = link.getAttribute('href');
      }
    } catch (err) {
      console.warn('Error storing default favicon:', err);
    }
  };

  // Update favicon when avatar changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted.current) return;
    let timeoutId: NodeJS.Timeout;

    const updateFavicon = async () => {
      try {
        if (!document?.head) return;

        // Remove existing favicons safely
        const existingFavicons = document.head.querySelectorAll("link[rel*='icon']");
        existingFavicons.forEach(favicon => {
          try {
            if (document.head?.contains(favicon)) {
              document.head.removeChild(favicon);
            }
          } catch (err) {
            console.warn('Error removing favicon:', err);
          }
        });

        // Create new favicon link
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        
        if (avatar) {
          try {
            // Create optimized favicon from avatar
            const img = new Image();
            img.src = avatar;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(img, 0, 0, 64, 64);
              link.href = canvas.toDataURL('image/png');
            } else {
              link.href = defaultFaviconRef.current || '/favicon.ico';
            }
          } catch (err) {
            console.warn('Error creating avatar favicon:', err);
            link.href = defaultFaviconRef.current || '/favicon.ico';
          }
        } else {
          link.href = defaultFaviconRef.current || '/favicon.ico';
        }

        if (document.head && isMounted.current) {
          document.head.appendChild(link);
        }
      } catch (err) {
        console.warn('Error updating favicon:', err);
        // Restore default favicon on error
        if (defaultFaviconRef.current && document.head && isMounted.current) {
          try {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = defaultFaviconRef.current;
            document.head.appendChild(link);
          } catch (error) {
            console.warn('Error restoring default favicon:', error);
          }
        }
      }
    };

    if (avatar) {
      timeoutId = setTimeout(updateFavicon, 1000);
    } else {
      updateFavicon();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [avatar]);

  return null;
}; 