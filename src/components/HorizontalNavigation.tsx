import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";
import DoctorRegistrationForm from "./DoctorRegistrationForm";
import { AdminTopBar } from "./AdminTopBar";
import { useIsMobile } from "@/hooks/use-mobile";

export function HorizontalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      
      // Get user role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.log('Profile fetch error:', profileError);
        setUserRole('user'); // Default fallback
        return;
      }
        
      if (profile) {
        console.log('User role:', profile.role);
        setUserRole(profile.role);
        
        // If user is a specialist, get their profile picture and name
        if (profile.role === 'specialist') {
          console.log('Fetching specialist profile for user:', userId);
          const { data: specialistProfile, error: specialistError } = await supabase
            .from('specialists')
            .select('profile_picture, name')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (specialistError) {
            console.log('Specialist fetch error:', specialistError);
            // Fallback: try to find by email
            const currentUser = await supabase.auth.getUser();
            if (currentUser.data.user?.email) {
              console.log('Trying to find specialist by email:', currentUser.data.user.email);
              const { data: specialistByEmail } = await supabase
                .from('specialists')
                .select('profile_picture, name')
                .eq('email', currentUser.data.user.email)
                .maybeSingle();
              
              if (specialistByEmail) {
                console.log('Found specialist by email:', specialistByEmail);
                setUserProfile(specialistByEmail);
              } else {
                console.log('No specialist found by email');
                setUserProfile(null);
              }
            }
            return;
          }
          
          if (specialistProfile) {
            console.log('Specialist profile found:', specialistProfile);
            setUserProfile(specialistProfile);
          } else {
            console.log('No specialist profile found');
            setUserProfile(null);
          }
        } else {
          // Clear specialist profile if not a specialist
          console.log('User is not a specialist, clearing profile');
          setUserProfile(null);
        }
      } else {
        // No profile found, set defaults
        console.log('No user profile found, setting defaults');
        setUserRole('user');
        setUserProfile(null);
      }
    } catch (error) {
      console.log('Profile fetch error:', error);
      setUserRole('user');
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
      console.log('Navigating to doctor panel...');
      navigate("/doktor-paneli");
    } else if (isLoggedIn && (userRole === 'admin' || userRole === 'staff')) {
      console.log('Navigating to admin panel...');
      navigate("/admin");
    } else {
      console.log('Not logged in or no specific role, navigating to login...');
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
    { path: "/blog", label: "Blog" },
    { path: "/iletisim", label: "İletişim" }
  ];

  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

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
                  src="/logo.png" 
                  alt="Doktorum Ol Logo" 
                  className="h-full w-auto object-contain"
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
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
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
                    <AvatarImage 
                      src={userProfile?.profile_picture || undefined} 
                      alt="Profil"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {userProfile?.name || 'Dr. Uzman'}
                    </p>
                    <p className="text-xs text-gray-500">Uzman Paneli</p>
                  </div>
                </div>
              )}
              
              {/* Kayıt ol ve Giriş butonları */}
              {authInitialized && !isLoggedIn && (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full font-medium px-6 py-2"
                    onClick={() => setShowRegistrationForm(true)}
                  >
                    Kayıt Olmak İstiyorum
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
                    onClick={() => navigate('/giris-yap')}
                  >
                    Giriş
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMobile && isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t shadow-lg z-50 rounded-b-2xl mx-4">
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleMenuItemClick}
                  className={`block px-4 py-3 rounded-full font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? "text-white bg-gradient-to-r from-blue-600 to-indigo-600"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="border-t pt-3 mt-3">
                {!authInitialized && (
                  <div className="px-4 py-3">
                    <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
                  </div>
                )}
                
                {shouldShowSpecialistProfile && (
                  <div 
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-full transition-all duration-200" 
                    onClick={handleProfileClick}
                  >
                    <Avatar className="w-8 h-8 border-2 border-blue-100">
                      <AvatarImage 
                        src={userProfile?.profile_picture || undefined} 
                        alt="Profil"
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {userProfile?.name || 'Dr. Uzman'}
                      </p>
                      <p className="text-xs text-gray-500">Uzman Paneli</p>
                    </div>
                  </div>
                )}
                
                {authInitialized && !isLoggedIn && (
                  <div className="space-y-2">
                    <Button 
                      variant="outline"
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full font-medium"
                      onClick={() => {
                        setShowRegistrationForm(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Kayıt Olmak İstiyorum
                    </Button>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => {
                        navigate('/giris-yap');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Giriş
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      <DoctorRegistrationForm
          isOpen={showRegistrationForm} 
          onClose={() => setShowRegistrationForm(false)} 
        />
      </>
    );
  }
