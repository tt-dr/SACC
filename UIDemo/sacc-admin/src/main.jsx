import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#d00', fontFamily: 'monospace', maxWidth: 800, margin: '40px auto' }}>
          <h2>React 渲染错误</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#fff3f3', padding: 16, borderRadius: 8 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  document.body.innerHTML = '<div style="padding:40px;color:red">#root element not found</div>'
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (error) {
    rootElement.innerHTML = `<div style="padding:32px;color:#d00;font-family:monospace"><h2>React mount error</h2><pre style="white-space:pre-wrap">${error.message}\n\n${error.stack}</pre></div>`
  }
}
