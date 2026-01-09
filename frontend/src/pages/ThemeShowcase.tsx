import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ThemeShowcase.css';

interface NoteCardProps {
  title: string;
  items: string[];
  theme: string;
}

function NoteCard({ title, items, theme }: NoteCardProps) {
  return (
    <div className={`note-card note-card--${theme}`}>
      <h3 className="note-card__title">{title}</h3>
      <ul className="note-card__list">
        {items.map((item, i) => (
          <li key={i} className="note-card__item">
            <span className="note-card__checkbox"></span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <button className="note-card__button">Add Item</button>
    </div>
  );
}

const sampleItems = ['Milk', 'Bread', 'Eggs'];

export default function ThemeShowcase() {
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  const themes = [
    {
      id: 'paper',
      name: 'Paper/Stationery',
      description: 'Tactile, warm, like real paper notes on a desk'
    },
    {
      id: 'brutalist',
      name: 'Neo-Brutalist',
      description: 'Bold, raw, unconventional with thick borders'
    },
    {
      id: 'risograph',
      name: 'Risograph',
      description: 'Print-inspired with limited colors and halftones'
    },
    {
      id: 'sketchy',
      name: 'Hand-drawn',
      description: 'Organic, wobbly lines, doodle aesthetic'
    },
    {
      id: 'mono',
      name: 'Monochrome + Accent',
      description: 'Clean black/white with bold accent color'
    },
    {
      id: 'terminal',
      name: 'Retro Terminal',
      description: 'Monospace, minimal, typewriter vibes'
    }
  ];

  return (
    <div className="theme-showcase">
      <header className="theme-showcase__header">
        <button onClick={() => navigate(-1)} className="theme-showcase__back">
          ← Back
        </button>
        <h1>Theme Showcase</h1>
        <p>Click on a theme to see it expanded</p>
      </header>

      <div className="theme-showcase__grid">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-showcase__section theme-section--${theme.id} ${activeTheme === theme.id ? 'active' : ''}`}
            onClick={() => setActiveTheme(activeTheme === theme.id ? null : theme.id)}
          >
            <div className="theme-showcase__info">
              <h2>{theme.name}</h2>
              <p>{theme.description}</p>
            </div>

            <div className="theme-showcase__preview">
              <NoteCard
                title="Shopping List"
                items={sampleItems}
                theme={theme.id}
              />
            </div>
          </div>
        ))}
      </div>

      {activeTheme && (
        <div className={`theme-showcase__fullview theme-fullview--${activeTheme}`}>
          <button
            className="theme-showcase__close"
            onClick={() => setActiveTheme(null)}
          >
            ✕ Close
          </button>

          <div className="theme-fullview__content">
            <header className={`theme-fullview__header header--${activeTheme}`}>
              <h1>SimpleNotes</h1>
              <nav>
                <span>Dashboard</span>
                <span>My Lists</span>
                <span>Settings</span>
              </nav>
            </header>

            <div className="theme-fullview__cards">
              <NoteCard title="Shopping List" items={['Milk', 'Bread', 'Eggs', 'Cheese']} theme={activeTheme} />
              <NoteCard title="Todo Today" items={['Call mom', 'Finish report', 'Gym']} theme={activeTheme} />
              <NoteCard title="Ideas" items={['New app feature', 'Blog post topic']} theme={activeTheme} />
            </div>

            <div className={`theme-fullview__input input--${activeTheme}`}>
              <input type="text" placeholder="Add a new item..." />
              <button>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
