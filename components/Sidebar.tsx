import React from 'react';
import { PromptusLogoIcon, PlayIcon, FilmIcon, GridIcon } from './icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDisabled?: boolean;
}

interface SidebarProps {
    isOpen: boolean;
}


const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, isDisabled }) => {
  const baseClasses = 'flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium transition-colors w-full';
  const activeClasses = 'bg-white text-promptus-dark shadow-md';
  const inactiveClasses = 'text-promptus-text-secondary hover:bg-promptus-surface hover:text-promptus-text-primary';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isDisabled ? disabledClasses : ''}`}
      disabled={isDisabled}
    >
      
      {icon}
      <span>{label}</span>
    </button>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside 
        className={`
            fixed inset-y-0 left-0 z-40
            w-64 sm:w-72 lg:w-80 xl:w-64 bg-promptus-dark flex-shrink-0 
            p-4 sm:p-6 flex flex-col gap-6 sm:gap-8 lg:gap-10
            border-r border-promptus-border/50
            transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            transition-transform duration-300 ease-in-out
            shadow-2xl lg:shadow-lg
        `}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <PromptusLogoIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white flex-shrink-0" />
        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Promptus</span>
      </div>
      <nav className="flex flex-col gap-2 sm:gap-3">
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