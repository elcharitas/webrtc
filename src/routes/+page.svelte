<script lang="ts">
  import { onMount } from "svelte";
  import io from "socket.io-client";

  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;

  let localStream: MediaStream;
  let remoteStream: MediaStream;

  let roomId: string;
  let userId: string;
  let isConnected = false;

  const socket = io();

  onMount(async () => {
    try {
      localStream = await navigator.mediaDevices?.getUserMedia({
        video: true,
        audio: true,
      });
      remoteStream = new MediaStream();
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

  socket.on("offer", async (offer, room) => {
    if (!peerConnection) {
      await createPeerConnection(room, false);
    }
    console.log("new user joined room", room);
    await peerConnection.setRemoteDescription(offer);

    roomId = room;

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", answer, room);
  });

  socket.on("answer", async (answer, room) => {
    console.log("received answer", answer);
    await peerConnection.setRemoteDescription(answer);

    console.log("connected", room);
  });

  async function createPeerConnection(roomId: string, withOffer = true) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("register", {
          room: roomId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      console.log(
        "remote stream",
        remoteStream,
        event.streams[0].getTracks().length
      );
      remoteVideo.srcObject = remoteStream;
    };

    if (!localStream) {
      console.log("No local stream to add to peer connection.");
      return;
    }

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    isConnected = true;

    if (withOffer) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("offer", offer, roomId);
      } catch (err) {
        console.error("Error creating peer connection.", err);
      }
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
