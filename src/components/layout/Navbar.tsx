import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, Moon, Sun, Menu, X, ChevronDown, Heart, MessageSquare,
  Layers, Scissors, FileStack, Hash, Droplets, 
  Image, ImagePlus, Minimize2, PenTool 
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const tools = [
  { title: 'Gabungkan PDF', icon: Layers, href: '/merge' },
  { title: 'Pisahkan PDF', icon: Scissors, href: '/split' },
  { title: 'Atur PDF', icon: FileStack, href: '/organize' },
  { title: 'Nomor Halaman', icon: Hash, href: '/page-numbers' },
  { title: 'Watermark', icon: Droplets, href: '/watermark' },
  { title: 'PDF ke JPG', icon: Image, href: '/pdf-to-jpg' },
  { title: 'JPG ke PDF', icon: ImagePlus, href: '/jpg-to-pdf' },
  { title: 'Kompres PDF', icon: Minimize2, href: '/compress' },
  { title: 'Tanda Tangan', icon: PenTool, href: '/sign' },
];

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const [showQris, setShowQris] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ duration: 0.5 }} 
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Main Navbar */}
      <div className="glass border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-primary">PDF</span><span className="text-foreground">Indo</span>
              </span>
            </Link>

            {/* Center - Feedback */}
            <div className="hidden md:flex items-center">
              <a 
                href="https://forms.gle/iErQNMgUMsPUmoqeA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Feedback
              </a>
            </div>

            {/* Right - Tools Dropdown & Theme */}
            <div className="hidden md:flex items-center gap-2">
              {/* Tools Dropdown - Hover */}
              <div 
                className="relative"
                onMouseEnter={() => setIsToolsOpen(true)}
                onMouseLeave={() => setIsToolsOpen(false)}
              >
                <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  Semua Tools
                  <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isToolsOpen && (
                  <div className="absolute top-0 right-full mr-1 w-56 bg-popover border border-border shadow-lg rounded-md p-1 z-50">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      PDF Indo
                    </div>
                    <div className="h-px bg-border my-1" />
                    {tools.map((tool) => (
                      <Link 
                        key={tool.href}
                        href={tool.href} 
                        className="flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
                      >
                        <tool.icon className="w-4 h-4 text-primary" />
                        <span>{tool.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={toggleTheme} 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {mounted ? (
                  theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />
                ) : (
                  <div className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={toggleTheme} 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {mounted ? (
                  theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />
                ) : (
                  <div className="w-5 h-5" />
                )}
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="md:hidden py-4 border-t border-border"
            >
              <div className="flex flex-col gap-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  PDF Indo
                </div>
                {tools.map((tool) => (
                  <Link 
                    key={tool.href}
                    href={tool.href} 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <tool.icon className="w-4 h-4 text-primary" />
                    {tool.title}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Support Banner */}
      <button
        onClick={() => setShowQris(true)}
        className="block w-full py-1.5 bg-gradient-to-r from-pink-500/10 via-pink-500/20 to-rose-500/10 border-b border-pink-500/10 hover:from-pink-500/20 hover:via-pink-500/30 hover:to-rose-500/20 transition-all"
      >
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <Heart className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          <span className="text-muted-foreground">Suka PDFIndo?</span>
          <span className="text-pink-500 font-medium">Dukung kami →</span>
        </div>
      </button>

      {/* QRIS Modal */}
      {showQris && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowQris(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Dukung PDFIndo</h3>
              <button
                onClick={() => setShowQris(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Scan QRIS di bawah untuk mendukung pengembangan PDFIndo
            </p>
            <div className="bg-white p-4 rounded-xl">
              <img 
                src="/Qris.PNG" 
                alt="QRIS PDFIndo" 
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Terima kasih atas dukungannya! ❤️
            </p>
          </motion.div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar;
