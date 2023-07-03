<script lang="ts">
  import { onMount } from "svelte";

  let currentVideo: HTMLVideoElement;
  export let peerId: string;
  export let stream: MediaStream;

  onMount(() => {
    if (!currentVideo) {
      console.error("Error getting video element.");
      return;
    }
    currentVideo.srcObject = stream;
  });
</script>

<div>
  <video bind:this={currentVideo} autoplay playsinline>
    <track kind="captions" />
  </video>
  {#if peerId}<p>User: {peerId}</p>{/if}
</div>

<style>
  video {
    width: 100%;
    max-width: 400px;
    height: 300px;
    border: 1px solid black;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    object-fit: cover;
    transition: box-shadow 0.3s ease-in-out;
  }

  video:hover {
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  }

  p {
    font-size: 1rem;
    text-align: center;
  }
</style>
