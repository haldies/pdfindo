import React from 'react';
import { FileText, Shield, Lock, Zap, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface-subtle">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-primary">PDF</span><span className="text-foreground">Indo</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Professional PDF tools that work entirely in your browser. 
              Your files never leave your device, ensuring complete privacy and security.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Features</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" />
                <span>100% Secure & Private</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <span>Fast Client-Side Processing</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>No File Size Limits</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">PDF Tools</h4>
            <ul className="space-y-2">
              {['Merge PDF', 'Split PDF', 'Compress PDF', 'Convert to JPG'].map(tool => (
                <li key={tool}>
                  <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {tool}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PDFIndo. All rights reserved. Built with ❤️ for privacy.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;