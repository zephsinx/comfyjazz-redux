// Type declarations for comfy.js (v1.1.27)
// Since no official @types package exists, this provides basic types for the parts used in this project.

declare module 'comfy.js' {
  interface ComfyJSFlags {
    // Add known flag properties here if needed, otherwise keep as general object
    [key: string]: any;
  }

  interface ComfyJSExtra {
    // Add known extra properties here if needed, otherwise keep as general object
    [key: string]: any;
  }

  type ComfyJSOnChatHandler = (
    user: string, 
    message: string, 
    flags: ComfyJSFlags, 
    self: boolean, // Assuming 'self' is a boolean indicating if the message is from the bot itself
    extra: ComfyJSExtra
  ) => void;

  interface ComfyJSStatic {
    /**
     * Initializes the ComfyJS connection to a Twitch channel.
     * @param channelName The name of the Twitch channel to connect to.
     */
    Init(channelName: string): void;

    /**
     * Callback function triggered when a chat message is received.
     * Assign your chat handling function to this property.
     */
    onChat?: ComfyJSOnChatHandler;

    // Add other ComfyJS methods/properties here if you use them
    // e.g., onCommand?: ComfyJSOnCommandHandler;
    // e.g., Say(message: string, channel?: string): void;
  }

  const ComfyJS: ComfyJSStatic;

  export default ComfyJS;
} 