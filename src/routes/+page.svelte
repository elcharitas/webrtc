<script lang="ts">
  import { onMount } from "svelte";
  import io from "socket.io-client";

  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;
  let localStream: MediaStream;

  let roomId: string;
  let userId: string;
  let isConnected = false;

  const socket = io();

  onMount(async () => {
    console.log("mounting");
    try {
      localStream = await navigator.mediaDevices?.getUserMedia({
        video: true,
        audio: true,
      });
      localVideo.srcObject = localStream;
      localVideo.muted = true;

      userId = socket.id;
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  });

  // WebRTC connection setup and handling
  let peerConnection: RTCPeerConnection;
  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  async function createPeerConnection(roomId: string) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("sending ice candidate", event.candidate);
        socket.emit("register", {
          room: roomId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    if (!localStream) {
      console.log("No local stream to add to peer connection.");
      return;
    }

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    isConnected = true;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("offer", { ...offer, room: "test" });
    } catch (err) {
      console.error("Error creating peer connection.", err);
    }
  }
</script>

<h1>WebRTC Call</h1>

<video bind:this={localVideo} autoplay playsinline>
  <track kind="captions" />
</video>
<video bind:this={remoteVideo} autoplay playsinline>
  <track kind="captions" />
</video>
<video bind:this={remoteVideo} autoplay playsinline>
  <track kind="captions" />
</video>

<div>
  {#if isConnected}
    <p>Room ID: {roomId}</p>
    <button>End Call</button>
  {:else}
    <p>Room ID: Not connected</p>
    {#if userId}
      <p>
        Personal ID: {userId} (You can share this for others to connect with you)
      </p>
    {:else}
      <p>Personal ID: Connecting</p>
    {/if}
    <input type="text" bind:value={roomId} />
    <button on:click={() => createPeerConnection(roomId)}> Join Call </button>
  {/if}
</div>
