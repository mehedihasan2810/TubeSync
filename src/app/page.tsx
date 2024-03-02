"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const queryClient = new QueryClient();

export default function Home() {
  const [currentPlaylist, setCurrentPlaylist] = useState("");
  const [loadedVideoCount, setLoadedVideoCount] = useState(10);
  const [loadedPlaylistsCount, setLoadedPlaylistsCount] = useState(5);
  const [selectedVideo, setSelectedVideo] = useState<any>({});
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const { toast } = useToast();

  const { data: session, status } = useSession();

  /**
   * Fetch all the playlists data with access token and youtube api key
   */
  const {
    isPending: isPlaylistsPending,
    error: playlistsError,
    data: playlists,
  } = useQuery({
    queryKey: ["playlists"],
    queryFn: () =>
      fetch(
        `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&maxResults=5&mine=true&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`,
        {
          method: "GET",
          headers: {
            // @ts-ignore
            Authorization: `Bearer ${session?.access_token}`,
            Accept: "application/json",
          },
        }
      ).then((res) => res.json()),
    enabled: status === "authenticated",
  });

  /**
   * Fetch all the videos of a selected playlist
   */
  const {
    isPending: isVideosPending,
    error: videosError,
    data: videos,
  } = useQuery({
    queryKey: ["videos", currentPlaylist, loadedVideoCount],
    queryFn: () =>
      fetch(
        `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${loadedVideoCount}&playlistId=${
          currentPlaylist || playlists.items[0].id
        }&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      ).then((res) => res.json()),
    enabled: !!playlists,
  });

  /**
   * Update youtube video content
   */
  const mutation = useMutation({
    mutationFn: (newData: any) => {
      return fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`,

        {
          method: "PUT",
          headers: {
            // @ts-ignore
            Authorization: `Bearer ${session?.access_token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
        }
      ).then((res) => res.json());
    },
  });

  return (
    <main className="max-w-6xl mx-auto px-4 mb-20">
      <Navbar />

      <section>
        <div className="my-10 text-center">
          <h1 className="font-bold text-4xl mb-2">Manage Youtube Channels</h1>
          <p>Easily Manage your all youtube channels from one place</p>
        </div>

        <h2 className="font-bold text-2xl mb-2">Your Playlists:</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Map all the fetched playlists */}
          {playlistsError || playlists?.error ? (
            <li className="my-2">Something went wrong! Try again</li>
          ) : isPlaylistsPending ? (
            Array.from({ length: 5 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="aspect-video" />
              </li>
            ))
          ) : (
            playlists.items.map((playlist: any) => (
              <li key={playlist.id}>
                <Card className="overflow-hidden">
                  <Image
                    className="aspect-video w-full h-full object-cover"
                    src={playlist.snippet.thumbnails.medium?.url}
                    width={180}
                    height={320}
                    alt={playlist.snippet.title}
                  />
                  <div className="flex gap-2 justify-between p-2 items-center">
                    <p
                      title={playlist.snippet.title}
                      className="font-semibold truncate"
                    >
                      {playlist.snippet.title}
                    </p>
                    <Button onClick={() => setCurrentPlaylist(playlist.id)}>
                      View full playlist
                    </Button>
                  </div>
                </Card>
              </li>
            ))
          )}
        </ul>

        {playlistsError || playlists?.error ? null : (
          <Button
            disabled={
              isPlaylistsPending ||
              playlists.items.length < loadedPlaylistsCount
            }
            onClick={() => setLoadedPlaylistsCount((c) => (c += 5))}
            variant="secondary"
            className="mt-4 font-semibold"
          >
            Load 5 more playlists
          </Button>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-2xl mb-2">
          Videos of {}
          <span className="italic">
            {!playlists || playlistsError || playlists?.error
              ? "..."
              : currentPlaylist
              ? playlists.items.find((p: any) => p.id === currentPlaylist)
                  .snippet.title
              : playlists.items[0].snippet.title}
          </span>
          &nbsp; playlist:
        </h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Map all the videos of the selected playlist */}
          {videosError || videos?.error || playlists?.error ? (
            <li className="my-2">Something went wrong! Try again</li>
          ) : isVideosPending ? (
            Array.from({ length: 5 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="aspect-video" />
              </li>
            ))
          ) : (
            videos.items.map((video: any) => (
              <li key={video.id}>
                <Card className="overflow-hidden">
                  <iframe
                    className="w-full aspect-video"
                    src={`https://www.youtube.com/embed/${video.snippet.resourceId.videoId}`}
                  ></iframe>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={async () => {
                          try {
                            /**
                             * Fetch the video we are going to edit
                             */
                            const data = await queryClient.fetchQuery({
                              queryKey: ["video"],
                              queryFn: () =>
                                fetch(
                                  `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${video.snippet.resourceId.videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`,
                                  {
                                    method: "GET",
                                    headers: {
                                      // @ts-ignore
                                      Authorization: `Bearer ${session?.access_token}`,
                                      Accept: "application/json",
                                    },
                                  }
                                ).then((res) => res.json()),
                            });
                            setTitle(data.items[0].snippet.title);
                            setDesc(data.items[0].snippet.description);
                            setSelectedVideo(data.items[0]);
                          } catch (error) {
                            console.log(error);
                          }
                        }}
                        className="m-3"
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Video</DialogTitle>
                        <DialogDescription>
                          Edit your youtube video.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            onChange={(e) => setTitle(e.target.value)}
                            value={title}
                            id="title"
                            placeholder="Edit Title..."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="desc">Description</Label>
                          <Textarea
                            onChange={(e) => setDesc(e.target.value)}
                            value={desc}
                            placeholder="Edit Desc..."
                            id="desc"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!title || mutation.isPending}
                          onClick={() => {
                            /**
                             * Update the selected video
                             */
                            mutation.mutate(
                              {
                                id: selectedVideo.id,
                                snippet: {
                                  ...selectedVideo.snippet,
                                  title,
                                  description: desc,
                                },
                              },
                              {
                                onSuccess: () => {
                                  toast({
                                    description: "Successfully edited",
                                  });
                                },
                                onError: (e) => {
                                  console.log(e);
                                  toast({
                                    variant: "destructive",
                                    description:
                                      "Something went wrong! Try again later",
                                  });
                                },
                              }
                            );
                          }}
                        >
                          Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Card>
              </li>
            ))
          )}
        </ul>
        {videosError || videos?.error ? null : (
          <Button
            disabled={isVideosPending || videos.items.length < loadedVideoCount}
            onClick={() => setLoadedVideoCount((c) => (c += 10))}
            variant="secondary"
            className="mt-4 font-semibold"
          >
            Load 10 more videos
          </Button>
        )}
      </section>
    </main>
  );
}
