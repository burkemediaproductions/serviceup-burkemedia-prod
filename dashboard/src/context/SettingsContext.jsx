import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { applyBranding, cacheSettings, preloadBrandImages, readCachedSettings } from '../lib/branding';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const cachedSettings = readCachedSettings();
  const [settings, setSettingsState] = useState(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);
  const [listViewsVersion, setListViewsVersion] = useState(0);

  const bumpListViewsVersion = () => {
    setListViewsVersion((v) => v + 1);
  };

  // 1) Load settings once
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/settings');
        if (!cachedSettings) await preloadBrandImages(data);
        setSettings(data);
      } catch (e) {
        console.warn('Failed to load settings, using defaults', e);

        const fallback = {
          app_name: 'ServiceUp',
          timezone: 'America/Los_Angeles',
          poweredBy: 'serviceup / bmp',
          theme: {
            mode: 'light',
            primary: '#000000',
            surface: '#ffffff',
            text: '#111111',
          },
          logoUrl: '/assets/logo.svg',
          faviconUrl: '/assets/logo.svg',
          appIconUrl: '/assets/logo.svg',
          hideChromeByRole: {
            VIEWER: false,
            EDITOR: false,
            ADMIN: false,
          },
          hideEditorPreviewByRole: {
            VIEWER: false,
            EDITOR: false,
            ADMIN: false,
          },
          hideJsonByRole: {
            VIEWER: true,
            EDITOR: true,
            ADMIN: false,
          },
        };

        setSettings(fallback);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Apply brand + metadata whenever settings changes
  useEffect(() => {
    if (!settings) return;

    applyBranding(settings);
    cacheSettings(settings);
  }, [settings]);

  function setSettings(next) {
    setSettingsState((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      if (resolved) {
        applyBranding(resolved);
        cacheSettings(resolved);
      }
      return resolved;
    });
  }

  // On a brand-new browser, wait for the first settings response so the UI's
  // first visible paint already has the correct tenant colors and imagery.
  if (loading && !settings) return null;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        loading,
        listViewsVersion,
        bumpListViewsVersion,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
