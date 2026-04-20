import { useCallback, useEffect, useRef, useState } from 'react';
import restaurantService from '../services/restaurant.service';
import { RestaurantCard } from '../components/ProtectedRoute';
import PaginationControls from '../components/PaginationControls';
import { MapPin, Navigation, Search, Star, Truck, X } from 'lucide-react';

const CATEGORIES = ['All', 'Chicken', 'Pizza', 'Burgers', 'Healthy', 'Sushi', 'Fast Food', 'Steakhouse'];

export default function HomePage() {
  const [pageState, setPageState] = useState({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 9 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(null);
  const [locationMode, setLocationMode] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const debounceRef = useRef(null);

  const fetchRestaurants = useCallback(async (page = 0, overrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantService.browse({
        page,
        size: pageState.size,
        search: overrides.search ?? (appliedSearch || undefined),
        category: (overrides.category ?? activeFilter) !== 'All' ? (overrides.category ?? activeFilter) : undefined,
      });
      setPageState((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurants.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, appliedSearch, pageState.size]);

  useEffect(() => {
    if (locationMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRestaurants(0), searchTerm ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [fetchRestaurants, searchTerm, locationMode]);

  const fetchNearby = useCallback(async (lat, lon, radius) => {
    setNearbyLoading(true);
    setNearbyError(null);
    try {
      const data = await restaurantService.getNearby(lat, lon, radius);
      setNearbyRestaurants(data);
    } catch {
      setNearbyError('Could not load nearby restaurants.');
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setNearbyError('Geolocation not supported.'); return; }
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setUserCoords({ lat: latitude, lon: longitude });
        setLocationMode(true);
        fetchNearby(latitude, longitude, radiusKm);
      },
      () => { setNearbyLoading(false); setNearbyError('Location access denied.'); }
    );
  };

  const handleExitNearby = () => {
    setLocationMode(false); setNearbyRestaurants([]); setNearbyError(null); setUserCoords(null);
    fetchRestaurants(0);
  };

  const handleRadiusChange = (r) => { setRadiusKm(r); if (userCoords) fetchNearby(userCoords.lat, userCoords.lon, r); };

  const displayRestaurants = locationMode ? nearbyRestaurants : pageState.content;
  const isLoading = locationMode ? nearbyLoading : loading;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <section style={heroStyle}>
        <div className="container" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
          <div style={heroContent}>
            <h1 style={heroTitle}>Food. Fast.<br /><span style={{ color: 'var(--primary)' }}>Delivered.</span></h1>
            <p style={heroSubtitle}>Order from the best restaurants near you. Delivered hot and fast.</p>
            <form style={searchWrap} onSubmit={(e) => { e.preventDefault(); setAppliedSearch(searchTerm.trim()); setLocationMode(false); }}>
              <Search size={18} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
              <input style={searchInput} type="text" placeholder="Search restaurants, cuisines..." value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value) { setActiveFilter('All'); setAppliedSearch(e.target.value); setLocationMode(false); } }} />
              {searchTerm && <button type="button" onClick={() => { setSearchTerm(''); setAppliedSearch(''); }} style={clearBtn}><X size={14} /></button>}
            </form>
            <div style={statsRow}>
              <div style={statItem}><span>{pageState.totalElements || '-'}</span><span style={statLabel}>Restaurants</span></div>
              <div style={statItem}><Truck size={10} /><span style={statLabel}>25–45 min delivery</span></div>
              <div style={statItem}><Star size={10} /><span style={statLabel}>Ratings &amp; reviews</span></div>
            </div>
          </div>
        </div>
      </section>

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div style={locationBar}>
          {!locationMode ? (
            <button style={nearbyBtn} onClick={handleUseMyLocation} disabled={nearbyLoading}>
              <Navigation size={15} />{nearbyLoading ? 'Locating…' : 'Restaurants near me'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={nearbyActivePill}><MapPin size={13} /><span>Within {radiusKm} km</span></div>
              {[5, 10, 20].map((r) => (
                <button key={r} style={{ ...radiusChip, ...(radiusKm === r ? radiusChipActive : {}) }} onClick={() => handleRadiusChange(r)}>{r} km</button>
              ))}
              <button style={exitNearbyBtn} onClick={handleExitNearby}><X size={13} /> Clear</button>
            </div>
          )}
          {nearbyError && <span style={nearbyErrorText}>{nearbyError}</span>}
        </div>

        {!locationMode && (
          <div style={filterRow}>
            {CATEGORIES.map((cat) => (
              <button key={cat} style={{ ...filterChip, ...(activeFilter === cat ? filterChipActive : {}) }}
                onClick={() => { setActiveFilter(cat); setAppliedSearch(''); setSearchTerm(''); fetchRestaurants(0, { category: cat }); }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={sectionTitle}>
            {locationMode ? 'Nearby Restaurants' : appliedSearch ? `Results for "${appliedSearch}"` : activeFilter !== 'All' ? `${activeFilter} Restaurants` : 'All Restaurants'}
          </h2>
          {!isLoading && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{locationMode ? displayRestaurants.length : pageState.totalElements} found</span>}
        </div>

        {isLoading && (
          <div className="grid-restaurants">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} style={skeletonCard}>
                <div className="skeleton" style={{ height: '185px', borderRadius: '12px 12px 0 0' }} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '20px', width: '60%', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '90%', borderRadius: '6px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (error || nearbyError) && (
          <div className="empty-state">
            <h3>Something went wrong</h3>
            <p>{error || nearbyError}</p>
            <button className="btn btn-primary" onClick={() => locationMode ? fetchNearby(userCoords?.lat, userCoords?.lon, radiusKm) : fetchRestaurants(pageState.currentPage)}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && !nearbyError && displayRestaurants.length === 0 && (
          <div className="empty-state">
            {locationMode
              ? <><h3>No restaurants found nearby</h3><p>Try a larger radius.</p><button className="btn btn-primary" onClick={handleExitNearby}>Show All</button></>
              : <><h3>No restaurants found</h3><p>Try a different search or filter.</p></>}
          </div>
        )}

        {!isLoading && !error && !nearbyError && displayRestaurants.length > 0 && (
          <>
            <div className="grid-restaurants animate-fade-in">
              {displayRestaurants.map((r) => (
                <div key={r.id} style={{ position: 'relative' }}>
                  <RestaurantCard restaurant={r} />
                  {locationMode && r.distanceKm != null && (
                    <div style={distanceBadge}><Navigation size={11} />{r.distanceKm} km away</div>
                  )}
                </div>
              ))}
            </div>
            {!locationMode && <PaginationControls page={pageState.currentPage} totalPages={pageState.totalPages} onPageChange={(p) => fetchRestaurants(p)} />}
          </>
        )}
      </main>
    </div>
  );
}

const heroStyle = { background: 'linear-gradient(135deg, #1A1612 0%, #2D2420 50%, #1A1612 100%)', color: 'white' };
const heroContent = { maxWidth: '600px' };
const heroTitle = { fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px', color: 'white' };
const heroSubtitle = { fontSize: '1.125rem', color: 'rgba(255,255,255,0.65)', marginBottom: '28px', lineHeight: 1.6 };
const searchWrap = { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: 'var(--radius-lg)', padding: '10px 16px', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const searchInput = { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', color: 'var(--text-primary)' };
const clearBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', padding: '2px' };
const statsRow = { display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' };
const statItem = { display: 'flex', alignItems: 'center', gap: '6px' };
const statLabel = { fontSize: '0.875rem', color: 'var(--text-secondary)' };
const locationBar = { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' };
const nearbyBtn = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };
const nearbyActivePill = { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'white', fontSize: '0.8rem', fontWeight: 600 };
const radiusChip = { padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 };
const radiusChipActive = { background: 'var(--surface-elevated)', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 };
const exitNearbyBtn = { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' };
const nearbyErrorText = { color: 'var(--error, #ef4444)', fontSize: '0.8rem' };
const filterRow = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' };
const filterChip = { padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-secondary)' };
const filterChipActive = { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)', boxShadow: 'var(--shadow-primary)' };
const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 };
const skeletonCard = { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' };
const distanceBadge = { position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(4px)' };
