'use client';

import { Component, Suspense, type ReactNode } from 'react';

export class LearnerModuleBoundary extends Component<{ children: ReactNode; onBack: () => void }, { failed: boolean; retrying: boolean }> {
  state = { failed: false, retrying: false };
  private retryController?: AbortController;
  componentWillUnmount() { this.retryController?.abort(); }
  static getDerivedStateFromError() { return { failed: true }; }
  async reopen() {
    const controller = this.retryController = new AbortController();
    this.setState({ retrying: true });
    try {
      // WebKit retains failed module fetches across reloads; replace only this player's cached responses.
      const urls = [...document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"],link[rel="stylesheet"]')]
        .map(link => new URL(link.href)).filter(url => url.origin === location.origin && /^\/_next\/static\/(?:chunks|css)\/learner-rounds[.-]/.test(url.pathname));
      await Promise.all(urls.map(async url => {
        const response = await fetch(url, { cache: 'reload', signal: controller.signal });
        if (!response.ok) throw new Error('De oefening is nog niet bereikbaar.');
        await response.arrayBuffer();
      }));
      if (!controller.signal.aborted) window.location.reload();
    } catch {
      if (!controller.signal.aborted) this.setState({ retrying: false });
    }
  }
  render() {
    if (this.state.failed) return <div className="honest-empty" role="alert">
      <p>De oefening kon niet worden geopend. Je bewaarde antwoorden blijven behouden.</p>
      <button className="secondary-button" disabled={this.state.retrying} onClick={() => { void this.reopen(); }}>Opnieuw openen</button>
      <button className="secondary-button" onClick={this.props.onBack}>Terug</button>
    </div>;
    return <Suspense fallback={<output className="honest-empty">De oefening wordt geladen…</output>}>{this.props.children}</Suspense>;
  }
}
