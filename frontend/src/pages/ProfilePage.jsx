import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProgress, updateProfile, createCheckoutSession, getCustomerPortal } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./ProfilePage.css";

function computeStreak(progressItems) {
  if (!progressItems || progressItems.length === 0) return 0;

  // Collect unique calendar dates with activity
  const dateset = new Set(
    progressItems.map(p => p.completed_at?.slice(0, 10)).filter(Boolean)
  );
  const dates = Array.from(dateset).sort().reverse(); // newest first
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak must include today or yesterday to be "active"
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / 86400000;
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getInitials(user) {
  if (user.first_name || user.last_name) {
    return (
      (user.first_name?.[0] || '').toUpperCase() +
      (user.last_name?.[0] || '').toUpperCase()
    ) || user.username.slice(0, 2).toUpperCase();
  }
  return user.username.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [progressItems, setProgressItems] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Populate form from user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.profile?.bio || '',
      });
      document.title = `Profile | Learning Platform`;
    }
  }, [user]);

  // Fetch all progress for streak + stats
  useEffect(() => {
    if (!user) { setProgressLoading(false); return; }
    const fetchAll = async () => {
      let all = [];
      let url = '/progress/';
      try {
        let page = 1;
        while (true) {
          const res = await getProgress({ page });
          all = all.concat(res.data.results);
          if (!res.data.next) break;
          page++;
        }
      } catch {
        // non-critical
      }
      setProgressItems(all);
      setProgressLoading(false);
    };
    fetchAll();
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await updateProfile(formData);
      await refreshUser();
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : (err.userMessage || 'Failed to save profile');
      setFormError(msg);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await createCheckoutSession();
      window.location.href = res.data.checkout_url;
    } catch {
      showToast('Failed to start checkout. Please try again.', 'error');
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await getCustomerPortal();
      window.location.href = res.data.portal_url;
    } catch {
      showToast('Failed to open billing portal. Please try again.', 'error');
      setPortalLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="page profile-page">
        <p>Please <Link to="/login">sign in</Link> to view your profile.</p>
      </div>
    );
  }

  const isPro = user.profile?.is_pro;
  const periodEnd = user.profile?.current_period_end
    ? new Date(user.profile.current_period_end).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const totalCompleted = progressItems.length;
  const streak = computeStreak(progressItems);

  return (
    <div className="page profile-page">
      <h1>Profile</h1>

      {/* Avatar + name */}
      <div className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {getInitials(user)}
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-username">{user.username}</h2>
          {(user.first_name || user.last_name) && (
            <p className="profile-display-name">
              {[user.first_name, user.last_name].filter(Boolean).join(' ')}
            </p>
          )}
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Edit form */}
        <section className="profile-section profile-form-section">
          <h3>Edit Profile</h3>
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself..."
                maxLength={500}
              />
            </div>
            {formError && <div className="form-error">{formError}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>

        <div className="profile-sidebar">
          {/* Subscription card */}
          <section className="profile-section subscription-card">
            <h3>Subscription</h3>
            <div className="subscription-status">
              <span className={`badge ${isPro ? 'badge--pro' : 'badge--neutral'} badge--lg`}>
                {isPro ? 'Pro' : 'Free'}
              </span>
              {isPro && periodEnd && (
                <p className="subscription-period">Renews {periodEnd}</p>
              )}
            </div>
            {isPro ? (
              <button
                className="btn-secondary"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? 'Opening…' : 'Manage Subscription'}
              </button>
            ) : (
              <div className="upgrade-section">
                <p className="upgrade-desc">Unlock Advanced modules with a Pro subscription.</p>
                <button
                  className="btn-primary"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Redirecting…' : 'Upgrade to Pro'}
                </button>
              </div>
            )}
          </section>

          {/* Learning stats */}
          <section className="profile-section learning-stats">
            <h3>Learning Stats</h3>
            {progressLoading ? (
              <div className="loading">Loading stats…</div>
            ) : (
              <div className="stats-grid">
                <div className="stats-item">
                  <span className="stats-value">{totalCompleted}</span>
                  <span className="stats-label">Lessons Completed</span>
                </div>
                <div className="stats-item">
                  <span className="stats-value">{streak}</span>
                  <span className="stats-label">
                    {streak === 1 ? 'Day Streak' : 'Day Streak'}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
