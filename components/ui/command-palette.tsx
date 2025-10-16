'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, FileText, HelpCircle, FolderOpen, Plus } from 'lucide-react';
import './command-palette.css';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Perform search when query changes
  useEffect(() => {
    if (search.length >= 2) {
      setIsSearching(true);
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.results || []);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const handleSelect = useCallback((callback: () => void) => {
    onOpenChange(false);
    callback();
  }, [onOpenChange]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global Command Menu"
      className="command-palette"
    >
      <div className="command-input-wrapper">
        <Search className="command-icon" />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command or search..."
          className="command-input"
        />
      </div>

      <Command.List className="command-list">
        <Command.Empty className="command-empty">
          No results found.
        </Command.Empty>

        {search.length < 2 ? (
          <>
            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="command-group">
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/articles/new'))}
                className="command-item"
              >
                <Plus className="command-item-icon" />
                <span>New Article</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(() => router.push('/qa/questions/new'))}
                className="command-item"
              >
                <HelpCircle className="command-item-icon" />
                <span>Ask Question</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(() => router.push('/search'))}
                className="command-item"
              >
                <Search className="command-item-icon" />
                <span>Search</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="command-group">
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/'))}
                className="command-item"
              >
                <FileText className="command-item-icon" />
                <span>Home</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(() => router.push('/qa'))}
                className="command-item"
              >
                <HelpCircle className="command-item-icon" />
                <span>Q&A</span>
              </Command.Item>
            </Command.Group>
          </>
        ) : (
          <>
            {/* Search Results */}
            {isSearching ? (
              <div className="command-loading">Searching...</div>
            ) : searchResults.length > 0 ? (
              <Command.Group heading="Search Results" className="command-group">
                {searchResults.map((result) => (
                  <Command.Item
                    key={result.id}
                    onSelect={() => handleSelect(() => router.push(result.url))}
                    className="command-item"
                  >
                    {result.type === 'article' ? (
                      <FileText className="command-item-icon" />
                    ) : (
                      <HelpCircle className="command-item-icon" />
                    )}
                    <div className="command-item-content">
                      <div>{result.title}</div>
                      {result.excerpt && (
                        <div className="command-item-description">{result.excerpt}</div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </>
        )}
      </Command.List>

      <div className="command-footer">
        <kbd>↑↓</kbd> Navigate
        <kbd>↵</kbd> Select
        <kbd>Esc</kbd> Close
      </div>
    </Command.Dialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}
