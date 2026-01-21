import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  delay?: number;
}

export default function ToolCard({ title, description, icon: Icon, href, delay = 0 }: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href={href} className="block h-full">
        <div className="h-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg flex flex-col md:flex-col items-center md:items-start">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-[10px] md:text-sm font-semibold text-foreground mb-1 text-center md:text-left w-full leading-tight">
            {title}
          </h3>
          <p className="hidden md:block text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}