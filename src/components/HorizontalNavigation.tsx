import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronDown, ChevronRight, User, Stethoscope } from "lucide-react";

import { AdminTopBar } from "./AdminTopBar";
import RegistrationForm from "./RegistrationForm";
import { useIsMobile } from "@/hooks/use-mobile";

export function HorizontalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const isMobile = useIsMobile();

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Navigation logo yüklenemedi, metin logo gösterilecek');
    const img = e.target as HTMLImageElement;
    // Eğer logo yüklenmezse metin logo göster
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = '<div class="text-lg font-bold text-blue-600">Doktorum Ol</div>';
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Get user role from user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.log('Profile fetch error:', profileError);
      }
        
      if (profile) {
        console.log('User role:', profile.role);
        setUserRole(profile.role);
        
        // If user is a specialist, get their profile picture and name
        if (profile.role === 'specialist') {
          const { data: specialistProfile } = await supabase
            .from('specialists')
            .select('profile_picture, name')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (specialistProfile) {
            setUserProfile(specialistProfile);
          } else {
            const currentUser = await supabase.auth.getUser();
            if (currentUser.data.user?.email) {
              const { data: specialistByEmail } = await supabase
                .from('specialists')
                .select('profile_picture, name')
                .eq('email', currentUser.data.user.email)
                .maybeSingle();
              setUserProfile(specialistByEmail || null);
            }
          }
        } else {
          setUserProfile(null);
        }
        return;
      }
      
      // No user_profiles row → check patient_profiles
      const { data: patient } = await supabase
        .from('patient_profiles')
        .select('full_name, profile_picture')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (patient) {
        console.log('Patient profile found');
        setUserRole('patient');
        setUserProfile({ name: patient.full_name, profile_picture: patient.profile_picture });
      } else {
        console.log('No profile found, defaulting to patient');
        setUserRole('patient');
        setUserProfile(null);
      }
    } catch (error) {
      console.log('Profile fetch error:', error);
      setUserRole('patient');
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setCurrentSession(session);
        setCurrentUser(session?.user ?? null);
        setIsLoggedIn(!!session?.user);
        
        if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setUserProfile(null);
          setIsLoading(false);
          setAuthInitialized(true);
        } else if (session?.user) {
          setIsLoading(true);
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).finally(() => {
                if (mounted) {
                  setIsLoading(false);
                  setAuthInitialized(true);
                }
              });
            }
          }, 0);
        } else {
          setUserRole(null);
          setUserProfile(null);
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    );

    // THEN check for existing session
    const initializeSession = async () => {
      try {
        console.log('Initializing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setCurrentSession(null);
            setCurrentUser(null);
            setIsLoggedIn(false);
            setUserRole(null);
            setUserProfile(null);
            setIsLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        if (mounted) {
          setCurrentSession(session);
          setCurrentUser(session?.user ?? null);
          setIsLoggedIn(!!session?.user);
          
          if (session?.user) {
            setIsLoading(true);
            await fetchUserProfile(session.user.id);
          } else {
            setUserRole(null);
            setUserProfile(null);
          }
          setIsLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setCurrentSession(null);
          setCurrentUser(null);
          setIsLoggedIn(false);
          setUserRole(null);
          setUserProfile(null);
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => currentPath === path;

  const handleProfileClick = () => {
    console.log('Profile clicked - isLoggedIn:', isLoggedIn, 'userRole:', userRole, 'authInitialized:', authInitialized, 'isLoading:', isLoading);
    
    // Auth tam initialize olmamışsa veya loading devam ediyorsa işlem yapma
    if (!authInitialized || isLoading) {
      console.log('Auth not ready yet, ignoring click');
      return;
    }
    
    if (isLoggedIn && userRole === 'specialist') {
      navigate("/doktor-paneli");
    } else if (isLoggedIn && (userRole === 'admin' || userRole === 'staff')) {
      navigate("/admin");
    } else if (isLoggedIn && userRole === 'patient') {
      navigate("/danisan-paneli");
    } else {
      navigate("/giris-yap");
    }
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  // Show specialist profile if conditions are met
  const shouldShowSpecialistProfile = authInitialized && !isLoading && isLoggedIn && userRole === 'specialist';

  console.log('Render state:', { 
    authInitialized, 
    isLoading, 
    isLoggedIn, 
    userRole, 
    shouldShowSpecialistProfile,
    userProfile: userProfile?.name 
  });

  const navigationItems = [
    { path: "/", label: "Anasayfa" },
    { path: "/uzmanlar", label: "Uzmanlar" },
    { path: "/ozel-firsat", label: "Fiyatlandırma" },
    { path: "/blog", label: "Blog" },
    { path: "/iletisim", label: "İletişim" }
  ];

  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Tam ekran menü açıkken arka plan kaydırmasını kilitle
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobile, isMobileMenuOpen]);


  return (
    <>
      <AdminTopBar userRole={userRole} />
      <div className="bg-white shadow-sm border-b relative">
        <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-14 overflow-hidden">
                <img 
                  src="/logo.webp" 
                  alt="Doktorum Ol Logo" 
                  className="h-full w-auto object-contain"
                  width="120"
                  height="56"
                  loading="eager"
                  onError={handleLogoError}
                />
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <NavigationMenu>
              <NavigationMenuList className="flex items-center gap-2">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.path}>
                    <NavigationMenuLink asChild>
                      <Link 
                        to={item.path} 
                        className={`px-6 py-3 font-medium transition-all duration-300 rounded-full border ${
                          isActive(item.path) 
                            ? "text-white bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent shadow-lg" 
                            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 border-gray-200 hover:border-blue-200"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="flex items-center gap-1.5 flex-nowrap">
              {authInitialized && !isLoggedIn && (
                <>
                  <button
                    onClick={() => navigate('/giris-yap')}
                    className="px-3 py-1.5 text-[11px] font-semibold text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-all duration-300 whitespace-nowrap"
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => navigate('/kayit-ol')}
                    className="px-3 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md whitespace-nowrap"
                  >
                    Üye Ol
                  </button>
                </>
              )}
              <button
                className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-800" />
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="w-6 h-[3px] bg-gray-800 rounded-full"></div>
                      <div className="w-6 h-[3px] bg-gray-800 rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-800 mt-1">MENU</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Desktop Right Side */}
          {!isMobile && (
            <div className="flex items-center gap-3">
              {/* Loading durumunda spinner göster */}
              {!authInitialized && (
                <div className="w-10 h-10 animate-pulse bg-gray-200 rounded-full"></div>
              )}
              
              {/* Uzman profili */}
              {shouldShowSpecialistProfile && (
                <div 
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-full transition-all duration-200 border border-gray-100 hover:border-blue-200" 
                  onClick={handleProfileClick}
                >
                  <Avatar className="w-9 h-9 border-2 border-blue-100">
                    <AvatarImage src={userProfile?.profile_picture || undefined} alt="Profil" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{userProfile?.name || 'Dr. Uzman'}</p>
                    <p className="text-xs text-gray-500">Uzman Paneli</p>
                  </div>
                </div>
              )}

              {/* Danışan profili */}
              {authInitialized && !isLoading && isLoggedIn && userRole === 'patient' && (
                <div 
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-full transition-all duration-200 border border-gray-100 hover:border-blue-200" 
                  onClick={handleProfileClick}
                >
                  <Avatar className="w-9 h-9 border-2 border-blue-100">
                    <AvatarImage src={userProfile?.profile_picture || undefined} alt="Profil" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{userProfile?.name || 'Danışan'}</p>
                    <p className="text-xs text-gray-500">Danışan Paneli</p>
                  </div>
                </div>
              )}

              {/* Kayıt ol ve Giriş butonları */}
              {authInitialized && !isLoggedIn && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/kayit-ol')}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full font-medium px-6 py-2"
                  >
                    Üye Ol
                  </Button>
                  <Button 
                    onClick={() => navigate('/giris-yap')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
                  >
                    Giriş Yap
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Fullscreen Menu — Apple tarzı */}
        {isMobile && isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-200"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "saturate(180%) blur(24px)",
              WebkitBackdropFilter: "saturate(180%) blur(24px)",
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Üst bar */}
            <div
              className="flex items-center justify-between px-5 pb-3 border-b border-gray-200/70"
              style={{ paddingTop: "max(env(safe-area-inset-top), 14px)" }}
            >
              <Link to="/" onClick={handleMenuItemClick} className="h-10 overflow-hidden">
                <img
                  src="/logo.webp"
                  alt="Doktorum Ol Logo"
                  className="h-full w-auto object-contain"
                  onError={handleLogoError}
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Menüyü kapat"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 active:scale-95 transition-transform"
              >
                <X className="h-5 w-5 text-gray-900" />
              </button>
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
              <p className="px-1 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Menü
              </p>
              <nav className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                {navigationItems.map((item, i) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleMenuItemClick}
                    className={`flex items-center justify-between px-4 py-4 active:bg-gray-50 transition-colors ${
                      i !== navigationItems.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <span
                      className={`text-[18px] tracking-[-0.01em] ${
                        isActive(item.path)
                          ? "font-semibold text-blue-600"
                          : "font-medium text-gray-900"
                      }`}
                    >
                      {item.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </Link>
                ))}
              </nav>

              {/* Profil / Auth */}
              <div className="mt-6">
                {!authInitialized && (
                  <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
                )}

                {(shouldShowSpecialistProfile ||
                  (authInitialized && !isLoading && isLoggedIn && userRole === "patient")) && (
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-[0.99] transition-transform text-left"
                  >
                    <Avatar className="w-11 h-11 border-2 border-blue-100">
                      <AvatarImage src={userProfile?.profile_picture || undefined} alt="Profil" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {userProfile?.name || (userRole === "patient" ? "Danışan" : "Dr. Uzman")}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {userRole === "patient" ? "Danışan Paneli" : "Uzman Paneli"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </button>
                )}

                {authInitialized && !isLoggedIn && (
                  <div className="space-y-3">
                    <Button
                      className="w-full h-12 text-[16px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg"
                      onClick={() => {
                        navigate("/giris-yap");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Giriş Yap
                    </Button>
                    {currentPath !== "/bu-aya-ozel" && (
                      <Button
                        variant="outline"
                        className="w-full h-12 text-[16px] border-gray-200 text-blue-600 hover:bg-blue-50 rounded-2xl font-semibold"
                        onClick={() => {
                          setShowRegistrationForm(true);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Kayıt Olmak İstiyorum
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        </div>
      </div>

        <RegistrationForm
          isOpen={showRegistrationForm} 
          onClose={() => setShowRegistrationForm(false)} 
        />
        </>
      );
    }
