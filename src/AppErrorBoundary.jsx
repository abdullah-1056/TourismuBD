import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    const {
      appName = "TourismuBD",
      restartCommand = "npm run dev",
    } = this.props;

    return (
      <main className="app-recovery" role="alert">
        <div>
          <p className="eyebrow">{appName}</p>
          <h1>We could not load this page.</h1>
          <p>Refresh the page. If it still does not load, restart this server with <code>{restartCommand}</code>.</p>
          <button type="button" onClick={() => window.location.reload()}>Refresh page</button>
        </div>
      </main>
    );
  }
}
