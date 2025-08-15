import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Lazy load tutorial pages
const Tutoriales = lazy(() => import('../../pages/tutoriales/Tutoriales.jsx'));
const TutorialesAutomatizacion = lazy(
  () => import('../../pages/tutoriales/TutorialesAutomatizacion.jsx'),
);
const TutorialesAprendizaje = lazy(
  () => import('../../pages/tutoriales/TutorialesAprendizaje.jsx'),
);
const TutorialesFlujos = lazy(() => import('../../pages/tutoriales/TutorialesFlujos.jsx'));
const TutorialesExpansion = lazy(() => import('../../pages/tutoriales/TutorialesExpansion.jsx'));
const TutorialDiscord = lazy(
  () => import('../../pages/tutoriales/tutorialesdiscord/TutorialDiscord.jsx'),
);
const TutorialDiscordChannelId = lazy(
  () => import('../../pages/tutoriales/tutorialesdiscord/TutorialDiscordChannelId.jsx'),
);

export default (
  <>
    <Route path='/tutoriales' element={<Tutoriales />} />
    <Route path='/tutoriales/aprendizaje' element={<TutorialesAprendizaje />} />
    <Route path='/tutoriales/automatizacion' element={<TutorialesAutomatizacion />} />
    <Route path='/tutoriales/expansion' element={<TutorialesExpansion />} />
    <Route path='/tutoriales/flujos' element={<TutorialesFlujos />} />
    <Route path='/tutoriales/discord' element={<TutorialDiscord />} />
    <Route path='/tutoriales/discord/channel-id' element={<TutorialDiscordChannelId />} />
  </>
);
