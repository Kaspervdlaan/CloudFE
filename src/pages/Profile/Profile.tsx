import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout/Layout';
import { MdPerson, MdEmail, MdAdminPanelSettings, MdCalendarToday } from 'react-icons/md';
import './_Profile.scss';

export function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout
        onSearch={() => {}}
        viewMode="list"
        onViewModeChange={() => {}}
        showSearch={false}
        showViewToggle={false}
      >
        <div className="profile">
          <div className="profile__container">
            <div className="profile__error">No user data available</div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout
      onSearch={() => {}}
      viewMode="list"
      onViewModeChange={() => {}}
      showSearch={false}
      showSidebar={false}
      showViewToggle={false}
    >
      <div className="profile">
        <div className="profile__container">
          <div className="profile__header">
            <div className="profile__avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <MdPerson size={32} />
              )}
            </div>
            <h1 className="profile__name">{user.name}</h1>
            {user.role === 'admin' && (
              <span className="profile__badge">
                <MdAdminPanelSettings size={16} />
                Admin
              </span>
            )}
          </div>

          <div className="profile__content">
            <div className="profile__section">
              <h2 className="profile__section-title">Account Information</h2>
              <div className="profile__info-list">
                <div className="profile__info-item">
                  <div className="profile__info-icon">
                    <MdEmail size={20} />
                  </div>
                  <div className="profile__info-content">
                    <div className="profile__info-label">Email</div>
                    <div className="profile__info-value">{user.email}</div>
                  </div>
                </div>

                <div className="profile__info-item">
                  <div className="profile__info-icon">
                    <MdPerson size={20} />
                  </div>
                  <div className="profile__info-content">
                    <div className="profile__info-label">Name</div>
                    <div className="profile__info-value">{user.name}</div>
                  </div>
                </div>

                <div className="profile__info-item">
                  <div className="profile__info-icon">
                    <MdAdminPanelSettings size={20} />
                  </div>
                  <div className="profile__info-content">
                    <div className="profile__info-label">Role</div>
                    <div className="profile__info-value">
                      {user.role === 'admin' ? 'Administrator' : 'User'}
                    </div>
                  </div>
                </div>

                <div className="profile__info-item">
                  <div className="profile__info-icon">
                    <MdCalendarToday size={20} />
                  </div>
                  <div className="profile__info-content">
                    <div className="profile__info-label">Member Since</div>
                    <div className="profile__info-value">{formatDate(user.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

