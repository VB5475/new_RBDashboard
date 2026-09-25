import { useCallback, useEffect, useState } from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import RnbSidebar from '../components/RnbSidebar';

import RnbHeader from '../components/RnbHeader';

import RegisterGrievanceModal from '../components/RegisterGrievanceModal';

import BroadcastMessageModal from '../components/BroadcastMessageModal';

import { useUser } from '../context/UserContext';

import { fetchBroadcastMessages } from '../services/broadcast';

import { useLargeScreen } from '../hooks/useLargeScreen';

import './RnbDashboardLayout.css';



const SIDEBAR_STORAGE = 'rnb_sideBarOpen';

const EXPANDED_MENU_STORAGE = 'rnb_expandedSubmenu';



function readSidebarOpen(isLg) {

  if (!isLg) return false;

  try {

    const saved = sessionStorage.getItem(SIDEBAR_STORAGE);

    return saved != null ? JSON.parse(saved) : true;

  } catch {

    return true;

  }

}



export default function RnbDashboardLayout() {

  const isLg = useLargeScreen();

  const location = useLocation();

  const [messages, setMessages] = useState([]);

  const [sidebarExpanded, setSidebarExpanded] = useState(() => readSidebarOpen(true));

  const [expandedMenu, setExpandedMenu] = useState(() => {

    try {

      const saved = sessionStorage.getItem(EXPANDED_MENU_STORAGE);

      return saved ? JSON.parse(saved) : null;

    } catch {

      return null;

    }

  });

  const [grievanceOpen, setGrievanceOpen] = useState(false);

  const navigate = useNavigate();

  const { user, setUser } = useUser();



  const updateSidebarExpanded = useCallback(

    (next) => {

      setSidebarExpanded(next);

      sessionStorage.setItem(SIDEBAR_STORAGE, JSON.stringify(next));

    },

    [],

  );



  const updateExpandedMenu = useCallback((menuId) => {

    setExpandedMenu(menuId);

    sessionStorage.setItem(EXPANDED_MENU_STORAGE, JSON.stringify(menuId));

  }, []);



  useEffect(() => {

    if (!isLg) {

      setSidebarExpanded(false);

    } else {

      setSidebarExpanded(readSidebarOpen(true));

    }

  }, [isLg]);



  useEffect(() => {

    const saved = sessionStorage.getItem(SIDEBAR_STORAGE);

    if (saved && isLg) {

      setSidebarExpanded(JSON.parse(saved));

    }

  }, [location.pathname, isLg]);



  useEffect(() => {

    let cancelled = false;

    (async () => {

      const result = await fetchBroadcastMessages();

      if (cancelled) return;

      if (result.logout) {

        navigate('/login', { replace: true });

        return;

      }

      setMessages(result.messages);

    })();

    return () => {

      cancelled = true;

    };

  }, [location.pathname, navigate]);



  const sidebarWidth = !isLg ? 0 : sidebarExpanded ? 270 : 76;

  const mobileDrawerOpen = !isLg && sidebarExpanded;



  function closeBroadcastModal() {

    setUser((u) => (u ? { ...u, showBrodCastMessage: false } : u));

  }



  async function refreshBroadcast() {

    const result = await fetchBroadcastMessages();

    if (!result.logout) setMessages(result.messages);

  }



  const initialBroadcast =

    messages[0]?.Message ?? messages[0]?.message ?? '';



  return (

    <div

      className="rnb-shell"

      style={{ '--sidebar-width': `${sidebarWidth}px` }}

    >

      {mobileDrawerOpen && (

        <button

          type="button"

          className="rnb-sidebar-backdrop"

          aria-label="Close menu"

          onClick={() => updateSidebarExpanded(false)}

        />

      )}

      <RnbSidebar

        expanded={sidebarExpanded}

        isLg={isLg}

        expandedMenu={expandedMenu}

        onExpandedChange={updateSidebarExpanded}

        onExpandedMenuChange={updateExpandedMenu}

        onGrievanceOpen={() => setGrievanceOpen(true)}

        onMobileNav={() => {

          if (!isLg) updateSidebarExpanded(false);

        }}

      />

      <div className="rnb-shell-main">

        <RnbHeader

          sidebarExpanded={sidebarExpanded}

          isLg={isLg}

          onMenuToggle={() => updateSidebarExpanded(!sidebarExpanded)}

          messages={messages}

        />

        <main className="rnb-main">

          <Outlet context={{ sidebarExpanded }} />

        </main>

      </div>



      <RegisterGrievanceModal open={grievanceOpen} onClose={() => setGrievanceOpen(false)} />

      <BroadcastMessageModal

        open={Boolean(user?.showBrodCastMessage)}

        onClose={closeBroadcastModal}

        initialMessage={initialBroadcast}

        onSaved={refreshBroadcast}

      />

    </div>

  );

}

