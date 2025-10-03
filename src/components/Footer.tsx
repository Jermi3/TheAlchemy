import React from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

const Footer: React.FC = () => {
  const { siteSettings, loading } = useSiteSettings();
  return (
    <footer className="bg-gradient-to-r from-alchemy-dusk/90 via-alchemy-emberDeep/80 to-alchemy-night/85 border-t border-alchemy-smoke/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand Section */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-alchemy-gold/20 rounded-full flex items-center justify-center overflow-hidden">
              {loading ? (
                <div className="w-full h-full bg-alchemy-smoke/60 rounded-full animate-pulse" />
              ) : siteSettings?.site_logo ? (
                <img
                  src={siteSettings.site_logo}
                  alt={siteSettings.site_name || "Site Logo"}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className="text-alchemy-gold text-lg hidden">⚗️</span>
            </div>
            <div>
              <h3 className="text-lg font-playfair font-semibold text-alchemy-cream">
                {loading ? (
                  <div className="w-24 h-5 bg-alchemy-smoke/60 rounded animate-pulse" />
                ) : (
                  siteSettings?.site_name || "The Alchemy"
                )}
              </h3>
              <p className="text-sm text-alchemy-cream/60">Mobile Bar Cebu</p>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-alchemy-cream/70 font-medium">Follow us:</span>
            <div className="flex space-x-3">
              {/* Facebook Link */}
              <a
                href="https://www.facebook.com/thealchemycebu"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-blue-600/20 hover:border-blue-400/40 transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Facebook"
              >
                <svg
                  className="w-5 h-5 text-alchemy-cream/70 group-hover:text-blue-300 transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram Link */}
              <a
                href="https://www.instagram.com/thealchemycebu"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:border-pink-400/40 transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Instagram"
              >
                <svg
                  className="w-5 h-5 text-alchemy-cream/70 group-hover:text-pink-300 transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243s.122-.928.49-1.243c.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243s-.122.928-.49 1.243c-.369.315-.807.49-1.297.49z"/>
                  <path d="M12.017 5.396c-3.623 0-6.551 2.928-6.551 6.551s2.928 6.551 6.551 6.551 6.551-2.928 6.551-6.551-2.928-6.551-6.551-6.551zm0 10.988c-2.448 0-4.437-1.989-4.437-4.437s1.989-4.437 4.437-4.437 4.437 1.989 4.437 4.437-1.989 4.437-4.437 4.437z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-alchemy-cream/50">
              © {new Date().getFullYear()} The Alchemy Cebu. All rights reserved.
            </p>
            <p className="text-xs text-alchemy-cream/40 mt-1">
              Crafted with passion for exceptional experiences
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
