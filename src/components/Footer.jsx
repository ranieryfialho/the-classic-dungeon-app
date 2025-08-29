import React from 'react';
import { ScrollText, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

function Footer({ className }) {
  return (
    <footer className={cn("relative z-20 w-full py-3 text-center bg-stone-charcoal/30 border-t border-stone-light/10", className)}>
      <p className="text-sm text-stone-light flex items-center justify-center gap-2">
        <ScrollText size={16} className="text-stone-light" />
        <span>Forjado por</span>
        <a 
          href="https://github.com/ranieryfialho/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-semibold text-frost-blue hover:text-ethereal-blue hover:underline flex items-center gap-1"
        >
          Raniery Fialho
          <Github size={14} />
        </a>
      </p>
    </footer>
  );
}

export default Footer;