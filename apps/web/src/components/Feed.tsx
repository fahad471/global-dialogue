import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Post {
  id: string;
  user_id: string;
  content: string;
  likes: number;
  views: number;
  created_at: string;
  username?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [commentsMap, setCommentsMap] = useState<{ [key: string]: Comment[] }>({});
  const [expandedPosts, setExpandedPosts] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState("created_at");
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);

  

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username)")
      .order(sortBy, { ascending: sortBy === "created_at" });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    const postsWithUsernames = data.map((p: any) => ({
      ...p,
      username: p.profiles?.username || "",
    }));

    setPosts(postsWithUsernames);
    postsWithUsernames.forEach((post) => fetchComments(post.id));
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*, profiles(username)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    const enriched = data.map((c: any) => ({
      ...c,
      username: c.profiles?.username || "",
    }));

    setCommentsMap((prev) => ({ ...prev, [postId]: enriched }));
  };

  const handleCreatePost = async () => {
  if (!newPost.trim() && uploadedMedia.length === 0) return;

  const mediaMarkdown = uploadedMedia.map((url) => {
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    return isVideo ? `[Video](${url})` : `![media](${url})`;
  }).join('\n');

  const finalContent = [newPost.trim(), mediaMarkdown].filter(Boolean).join('\n\n');

  const { error } = await supabase.from("posts").insert({
    user_id: user?.id,
    content: finalContent,
  });

  if (!error) {
    setNewPost("");
    setUploadedMedia([]); // clear uploaded media
    fetchPosts();
  }
};


  const handleLike = async (postId: string) => {
    if (!user?.id) return;

    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.rpc("increment_post_likes", { post_id_input: postId });
      fetchPosts();
    }
  };

  const handleView = async (postId: string) => {
    if (!user?.id) return;

    const { data: existing } = await supabase
      .from("post_views")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("post_views").insert({ post_id: postId, user_id: user.id });
      await supabase.rpc("increment_post_views", { post_id_input: postId });
      fetchPosts();
    }
  };

  const toggleExpand = (postId: string) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user?.id,
      content: text,
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    fetchComments(postId);
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    fetchPosts();
  };

  const handleEditPost = async (postId: string) => {
    const newContent = prompt("Edit your post:");
    if (newContent) {
      await supabase.from("posts").update({ content: newContent }).eq("id", postId);
      fetchPosts();
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    await supabase.from("post_comments").delete().eq("id", commentId);
    fetchComments(postId);
  };

  const handleEditComment = async (postId: string, commentId: string) => {
    const updated = prompt("Edit your comment:");
    if (updated) {
      await supabase.from("post_comments").update({ content: updated }).eq("id", commentId);
      fetchComments(postId);
    }
  };

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const filePath = `user_uploads/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from("media").upload(filePath, file);
  if (error) {
    console.error("File upload failed:", error.message);
    return;
  }

  const { data: publicData } = supabase.storage.from("media").getPublicUrl(filePath);
  const publicUrl = publicData?.publicUrl;
  if (publicUrl) {
    setUploadedMedia((prev) => [...prev, publicUrl]);
  }
};


  // Custom renderers for ReactMarkdown
  const renderers = {
    a: (props: any) => {
      const href = props.href || "";
      const isVideo = href.match(/\.(mp4|webm|ogg)$/i);
      if (isVideo) {
        return (
          <video controls width="100%" className="rounded-md my-2">
            <source src={href} />
            Sorry, your browser doesn't support embedded videos.
          </video>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {props.children}
        </a>
      );
    },
    img: (props: any) => (
      <img
        {...props}
        alt={props.alt || ""}
        className="max-w-full rounded-md my-2"
        style={{ maxHeight: "400px" }}
      />
    ),
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Post Box */}
      <div className="bg-muted p-4 rounded-xl shadow-md">
        <textarea
          className="w-full bg-background border border-secondaryText rounded-md p-3 text-text"
          rows={3}
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />

        {/* Markdown preview */}
<div className="prose mt-2 p-2 border rounded-md bg-muted max-w-full break-words">
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
    {newPost}
  </ReactMarkdown>

  {/* Render uploaded media preview */}
  {uploadedMedia.map((url, idx) => {
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    return isVideo ? (
      <video key={idx} controls className="rounded-md my-2 max-w-full">
        <source src={url} />
      </video>
    ) : (
      <img
        key={idx}
        src={url}
        alt="uploaded media"
        className="rounded-md my-2 max-w-full"
        style={{ maxHeight: "400px" }}
      />
    );
  })}
</div>

        <div className="flex justify-between items-center mt-2">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="text-sm"
          />
          <button
            onClick={handleCreatePost}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent"
          >
            Post
          </button>
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-end">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="mb-4 p-2 border rounded-md bg-background text-text"
        >
          <option value="created_at">Most Recent</option>
          <option value="likes">Most Liked</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {/* Feed */}
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-surface p-5 rounded-xl shadow-sm border border-secondaryText cursor-pointer"
          onClick={() => handleView(post.id)}
        >
          <div className="text-sm text-secondaryText mb-1 font-semibold">
            @{post.username || "anonymous"}
          </div>
          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
              {post.content}
            </ReactMarkdown>
          </div>

          <div className="text-sm text-secondaryText flex justify-between mt-2">
            <span>{new Date(post.created_at).toLocaleString()}</span>
            <div className="space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(post.id);
                }}
                className="hover:text-accent"
              >
                ❤️ {post.likes}
              </button>
              <span>👀 {post.views}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(post.id);
                }}
                className="hover:text-accent"
              >
                💬 {commentsMap[post.id]?.length || 0}
              </button>
            </div>
          </div>

          {/* Edit/Delete Buttons for Posts */}
          {user?.id === post.user_id && (
            <div className="flex gap-2 mt-2 text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPost(post.id);
                }}
                className="text-blue-500 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost(post.id);
                }}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          )}

          {/* Comments Section */}
          {expandedPosts[post.id] && (
            <div className="mt-4 space-y-2 border-t border-secondaryText pt-3">
              {commentsMap[post.id]?.map((c) => (
                <div
                  key={c.id}
                  className="bg-muted rounded-md p-2 text-sm text-text"
                >
                  <div className="font-semibold text-secondaryText mb-1">
                    @{c.username}
                  </div>
                  <div>{c.content}</div>
                  <div className="text-xs text-secondaryText mt-1 flex justify-between">
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                    {user?.id === c.user_id && (
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleEditComment(post.id, c.id)}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(post.id, c.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add comment */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  className="flex-1 p-2 rounded-md border border-secondaryText bg-background text-text"
                  placeholder="Write a comment..."
                  value={commentInputs[post.id] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                />
                <button
                  className="bg-primary text-white px-3 py-1 rounded-md hover:bg-accent"
                  onClick={() => handleCommentSubmit(post.id)}
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
