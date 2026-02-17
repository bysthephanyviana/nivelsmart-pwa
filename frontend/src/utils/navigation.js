import { matchPath } from 'react-router-dom';

/**
 * Define Parent Routes for "Smart Back" logic.
 * Key: The current route pattern.
 * Value: The parent route path OR a function to dynamic generate it.
 */
const PATH_PARENTS = {
    // Creating/Editing Condos -> Back to Dashboard
    '/condominios/novo': '/dashboard',
    '/condominios/editar/:id': '/dashboard',

    // Viewing Condo -> Back to Dashboard
    '/condominio/:id': '/dashboard',

    // Creating/Editing Reservoirs -> Back to Condo Detail
    '/reservatorios/novo': (params, location) => {
        // Try to get from location state first, or query param
        const searchParams = new URLSearchParams(location.search);
        const condoId = searchParams.get('condominioId');
        return condoId ? `/condominio/${condoId}` : '/dashboard';
    },
    '/reservatorios/editar/:id': (params, location) => {
        const searchParams = new URLSearchParams(location.search);
        const condoId = searchParams.get('condominioId');
        return condoId ? `/condominio/${condoId}` : '/dashboard';
    },

    // Sensor Details -> Back to Reservoir OR Dashboard
    '/sensor/:id': (params, location) => {
        // If we came from a reservoir page (check history/state ideally, but here we can't easily access history state in this pure function without context)
        // A safer bet for flat hierarchy: Go to dashboard if no other context.
        // However, we can try to rely on previous path if available or default to dashboard
        return '/dashboard';
    },

    // Fallback
    'default': '/dashboard'
};

/**
 * Resolves the parent path based on current location
 * @param {object} location - React Router location object
 * @param {object} params - React Router params object
 */
export const getParentPath = (location, params) => {
    // 1. Find matching pattern
    const patterns = Object.keys(PATH_PARENTS);
    let matchedPattern = null;
    let matchParams = {};

    for (const pattern of patterns) {
        if (pattern === 'default') continue;
        const match = matchPath(pattern, location.pathname);
        if (match) {
            matchedPattern = pattern;
            matchParams = match.params;
            break;
        }
    }

    // 2. Resolve Path
    const parent = matchedPattern ? PATH_PARENTS[matchedPattern] : PATH_PARENTS['default'];

    if (typeof parent === 'function') {
        return parent({ ...params, ...matchParams }, location);
    }

    return parent;
};

/**
 * Returns the page title based on the current path
 */
export const getPageTitle = (pathname) => {
    if (pathname.includes('/login')) return 'Login';
    if (pathname.includes('/dashboard')) return 'Meus Imóveis';
    if (pathname.includes('/condominio') && !pathname.includes('novo') && !pathname.includes('editar')) return 'Reservatórios';
    if (pathname.includes('/reservatorios/novo')) return 'Novo Reservatório';
    if (pathname.includes('/reservatorios/editar')) return 'Editar Reservatório';
    if (pathname.includes('/condominios/novo')) return 'Novo Condomínio';
    if (pathname.includes('/condominios/editar')) return 'Editar Condomínio';
    if (pathname.includes('/sensor')) return 'Detalhes do Sensor';
    if (pathname.includes('/perfil')) return 'Meu Perfil';
    if (pathname.includes('/vincular')) return 'Vincular Sensor';
    return 'NivelSmart';
};
