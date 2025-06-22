import { ref, readonly, onMounted, onUnmounted } from 'vue'

export function useRealTimeUpdates(endpoint) {
  const data = ref(null)
  const isConnected = ref(false)
  const error = ref(null)
  const channel = ref(null)
  
  // Laravel Echo with Reverb implementation
  const connect = () => {
    try {
      // Check if Echo is available globally
      if (!window.Echo) {
        error.value = 'Laravel Echo is not initialized. Please ensure Echo is configured in your bootstrap.js file.'
        console.error('Laravel Echo not found. Make sure to configure Echo in resources/js/bootstrap.js')
        return
      }

      // Subscribe to the channel
      channel.value = window.Echo.channel(endpoint)
      
      // Set up connection state listeners
      if (window.Echo.connector && window.Echo.connector.pusher) {
        const pusher = window.Echo.connector.pusher
        
        pusher.connection.bind('connected', () => {
          isConnected.value = true
          error.value = null
          console.log(`Connected to channel: ${endpoint}`)
          
          // Emit initial connection data
          data.value = {
            timestamp: new Date().toISOString(),
            endpoint,
            status: 'connected',
            connectionId: pusher.connection.socket_id
          }
        })

        pusher.connection.bind('disconnected', () => {
          isConnected.value = false
          console.log(`Disconnected from channel: ${endpoint}`)
        })

        pusher.connection.bind('error', (err) => {
          error.value = err.message || 'Connection error'
          isConnected.value = false
          console.error(`Connection error for ${endpoint}:`, err)
        })

        pusher.connection.bind('state_change', (states) => {
          console.log(`Channel ${endpoint} state changed from ${states.previous} to ${states.current}`)
          isConnected.value = states.current === 'connected'
        })
      }

    } catch (err) {
      error.value = err.message
      console.error('Echo connection error:', err)
    }
  }

  const disconnect = () => {
    if (channel.value) {
      window.Echo.leaveChannel(endpoint)
      channel.value = null
    }
    isConnected.value = false
    console.log(`Disconnected from channel: ${endpoint}`)
  }

  const subscribe = (eventName, callback) => {
    if (!channel.value) {
      console.warn(`Cannot subscribe to ${eventName}: channel not connected`)
      return
    }
    
    console.log(`Subscribing to event: ${eventName} on channel: ${endpoint}`)
    channel.value.listen(eventName, callback)
  }

  const unsubscribe = (eventName) => {
    if (!channel.value) {
      console.warn(`Cannot unsubscribe from ${eventName}: channel not connected`)
      return
    }
    
    console.log(`Unsubscribing from event: ${eventName} on channel: ${endpoint}`)
    channel.value.stopListening(eventName)
  }

  const emit = (eventName, eventData) => {
    if (!channel.value || !isConnected.value) {
      console.warn(`Cannot emit ${eventName}: channel not connected`)
      return
    }
    
    console.log(`Emitting event: ${eventName}`, eventData)
    // For client events (whispers), use the whisper method
    if (channel.value.whisper) {
      channel.value.whisper(eventName, eventData)
    } else {
      console.warn('Whisper not available - this may be a public channel')
    }
  }

  // Subscribe to private channel (for authenticated users)
  const subscribePrivate = (channelName) => {
    if (!window.Echo) {
      error.value = 'Laravel Echo is not initialized'
      return null
    }
    
    const privateChannel = window.Echo.private(channelName)
    console.log(`Subscribed to private channel: ${channelName}`)
    return privateChannel
  }

  // Subscribe to presence channel (for real-time user presence)
  const subscribePresence = (channelName) => {
    if (!window.Echo) {
      error.value = 'Laravel Echo is not initialized'
      return null
    }
    
    const presenceChannel = window.Echo.join(channelName)
    console.log(`Joined presence channel: ${channelName}`)
    return presenceChannel
  }

  // Listen for notifications (for authenticated users)
  const listenForNotifications = (callback) => {
    if (!window.Echo) {
      error.value = 'Laravel Echo is not initialized'
      return
    }
    
    // Assuming user ID is available globally or passed as parameter
    const userId = window.Laravel?.user?.id || 1 // Fallback for demo
    window.Echo.private(`App.Models.User.${userId}`)
      .notification(callback)
  }

  // Get socket ID for Laravel's toOthers() functionality
  const getSocketId = () => {
    return window.Echo?.socketId() || null
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    data: readonly(data),
    isConnected: readonly(isConnected),
    error: readonly(error),
    channel: readonly(channel),
    subscribe,
    unsubscribe,
    emit,
    connect,
    disconnect,
    subscribePrivate,
    subscribePresence,
    listenForNotifications,
    getSocketId
  }
}

// Installation instructions for Laravel Echo with Reverb:
// 1. Install packages: npm install --save-dev laravel-echo pusher-js
// 2. Configure in resources/js/bootstrap.js:
/*
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
*/

// 3. Add to .env file:
/*
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
*/ 