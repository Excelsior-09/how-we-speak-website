// ==============================================================================
// HOW WE SPEAK — PADDLE BILLING CLIENT INITIALIZATION & CHECKOUT HELPER
// Environment: Production (default: no sandbox call)
// Paddle Retain: Supports pwCustomer for churn prevention and subscription retention
// ==============================================================================

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: {
        token: string
        eventCallback?: (data: any) => void
        pwCustomer?: { id: string }
        checkout?: {
          settings?: {
            displayMode?: 'overlay' | 'inline'
            theme?: 'light' | 'dark'
            locale?: string
          }
        }
      }) => void
      Environment?: {
        set: (env: 'sandbox' | 'production') => void
      }
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity?: number }>
          customer?: { email?: string }
          customData?: Record<string, any>
          settings?: {
            displayMode?: 'overlay' | 'inline'
            theme?: 'light' | 'dark'
            successUrl?: string
          }
        }) => void
      }
    }
  }
}

// Map product identifiers to Live Paddle Price IDs (pri_...)
export const LIVE_PRICE_IDS: Record<string, string> = {
  'bundle': import.meta.env.VITE_PADDLE_PRICE_BUNDLE || '',
  'men-edition': import.meta.env.VITE_PADDLE_PRICE_MEN_EDITION || '',
  'women-edition': import.meta.env.VITE_PADDLE_PRICE_WOMEN_EDITION || '',
  'script-collection': import.meta.env.VITE_PADDLE_PRICE_SCRIPTS || '',
  'sex-talk': import.meta.env.VITE_PADDLE_PRICE_SEX_TALK || ''
}

let isPaddleInitialized = false

/**
 * Loads the official Paddle.js v2 script tag dynamically
 */
export async function loadPaddleScript(): Promise<void> {
  if (window.Paddle) return

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="paddle.com/paddle/v2/paddle.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paddle.js SDK'))
    document.head.appendChild(script)
  })
}

/**
 * Initializes Paddle Billing client for production
 * - Uses live environment as default
 * - Retain integration: attaches signed-in customer's Paddle Customer ID (pwCustomer)
 */
export async function initializePaddle(paddleCustomerId?: string | null): Promise<boolean> {
  await loadPaddleScript()

  if (!window.Paddle) {
    console.error('Paddle SDK unavailable.')
    return false
  }

  const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
  if (!clientToken) {
    console.warn('VITE_PADDLE_CLIENT_TOKEN is not configured.')
    return false
  }

  // Live configuration: Paddle Retain requires pwCustomer with Paddle customer ID (ctm_...)
  const initConfig: Parameters<NonNullable<typeof window.Paddle>['Initialize']>[0] = {
    token: clientToken,
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'light'
      }
    }
  }

  if (paddleCustomerId && paddleCustomerId.startsWith('ctm_')) {
    initConfig.pwCustomer = { id: paddleCustomerId }
  }

  window.Paddle.Initialize(initConfig)
  isPaddleInitialized = true
  return true
}

/**
 * Opens Paddle Checkout for a given product or live price ID
 */
export async function openLiveCheckout(
  productKeyOrPriceId: string,
  userEmail?: string,
  paddleCustomerId?: string | null
): Promise<void> {
  if (!isPaddleInitialized) {
    await initializePaddle(paddleCustomerId)
  }

  if (!window.Paddle) {
    throw new Error('Paddle.js not initialized')
  }

  // Resolve price ID (either direct pri_... or mapped key)
  const priceId = productKeyOrPriceId.startsWith('pri_')
    ? productKeyOrPriceId
    : LIVE_PRICE_IDS[productKeyOrPriceId]

  if (!priceId) {
    throw new Error(`No live price ID configured for product: ${productKeyOrPriceId}`)
  }

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: userEmail ? { email: userEmail } : undefined,
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      successUrl: `${window.location.origin}/app/dashboard?payment=success`
    }
  })
}
