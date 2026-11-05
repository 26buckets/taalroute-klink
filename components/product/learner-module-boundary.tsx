'use client';

import { Component, Suspense, type ReactNode } from 'react';

export class LearnerModuleBoundary extends Component<{ children: ReactNode; onBack: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="honest-empty" role="alert">
      <p>De oefening kon niet worden geopend. Je bewaarde antwoorden blijven behouden.</p>
      <button className="secondary-button" onClick={() => window.location.reload()}>Opnieuw openen</button>
      <button className="secondary-button" onClick={this.props.onBack}>Terug</button>
    </div>;
    return <Suspense fallback={<output className="honest-empty">De oefening wordt geladen…</output>}>{this.props.children}</Suspense>;
  }
}
