import React from 'react';
import { PromptusLogoIcon, PlayIcon, FilmIcon, GridIcon, MenuIcon } from './icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDisabled?: boolean;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}


const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, isDisabled }) => {
  const baseClasses = 'flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full';
  const activeClasses = 'bg-white text-promptus-dark shadow-md';
  const inactiveClasses = 'text-promptus-text-secondary hover:bg-promptus-surface hover:text-promptus-text-primary';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isDisabled ? disabledClasses : ''}`}
      disabled={isDisabled}
    >
      <MenuIcon className="w-5 h-5" />
      {icon}
      <span>{label}</span>
    </button>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside 
        className={`
            fixed lg:relative inset-y-0 left-0 z-40
            w-64 bg-promptus-dark flex-shrink-0 p-6 flex flex-col gap-10 
            border-r border-promptus-border/50
            transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            transition-transform duration-300 ease-in-out
        `}
    >
      <div className="flex items-center gap-3">
        <PromptusLogoIcon className="w-10 h-10 text-white" />
        <span className="text-2xl font-bold text-white">Promptus</span>
      </div>
      <nav className="flex flex-col gap-3">
        <NavItem 
            icon={<PlayIcon className="w-5 h-5" />}
            label="Playground"
            isDisabled
        />
        <NavItem 
            icon={<FilmIcon className="w-5 h-5" />}
            label="Media Lab"
            isActive
        />
        <NavItem 
            icon={<GridIcon className="w-5 h-5" />}
            label="My Collection"
            isDisabled
        />
      </nav>
    </aside>
  );
};