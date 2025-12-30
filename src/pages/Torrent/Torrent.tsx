import { useState } from 'react';
import { Layout } from '../../components/layout/Layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { MdCloudDownload } from 'react-icons/md';
import './_Torrent.scss';

export function Torrent() {
  const [magnetLink, setMagnetLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!magnetLink.trim()) {
      return;
    }

    // Validate magnet link format
    if (!magnetLink.trim().startsWith('magnet:?')) {
      alert('Please enter a valid magnet link (must start with magnet:?)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Console.log for now as requested
      console.log('Magnet link submitted:', magnetLink.trim());
      
      // TODO: Send to server
      // await api.submitTorrent(magnetLink.trim());
      
      // Clear the input after submission
      setMagnetLink('');
      
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error submitting torrent:', error);
      alert('Failed to submit torrent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Auto-paste detection - could be enhanced
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.startsWith('magnet:?')) {
      setMagnetLink(pastedText);
    }
  };

  return (
    <Layout
      onSearch={() => {}}
      viewMode="list"
      onViewModeChange={() => {}}
      showSearch={false}
      showViewToggle={false}
      showSidebar={false}
    >
      <div className="torrent">
        <div className="torrent__container">
          <div className="torrent__header">
            <div className="torrent__icon">
              <MdCloudDownload size={48} />
            </div>
            <h1 className="torrent__title">Add Torrent</h1>
            <p className="torrent__subtitle">
              Paste a magnet link to add a new torrent download
            </p>
          </div>

          <form className="torrent__form" onSubmit={handleSubmit}>
            <div className="torrent__input-group">
              <label htmlFor="magnet-link" className="torrent__label">
                Magnet Link
              </label>
              <textarea
                id="magnet-link"
                className="torrent__input"
                value={magnetLink}
                onChange={(e) => setMagnetLink(e.target.value)}
                onPaste={handlePaste}
                placeholder="magnet:?xt=urn:btih:..."
                rows={4}
                disabled={isSubmitting}
                required
              />
              <p className="torrent__hint">
                Paste your magnet link here. It should start with "magnet:?"
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!magnetLink.trim() || isSubmitting}
              className="torrent__submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Add Torrent'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

