import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// Define TypeScript interfaces for our data structures
interface BlogPost {
  _id: string
  title: string
  content: string
  author_id: string
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch blog posts when component mounts
  useEffect(() => {
    const fetchPosts = async () => {
        try {
            const response = await fetch('http://localhost:8000/blog/posts', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            })
            const data = await response.json()
            // Sort posts by created_at in descending order
            const sortedPosts = data.sort((a: BlogPost, b: BlogPost) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setPosts(sortedPosts)
        } catch (error) {
            console.error('Error fetching posts:', error)
        }
    }
    fetchPosts()
  }, [])

  // Handle creating a new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.accessToken) {
      console.error('No access token found')
      return
    }
  
    try {
        const response = await fetch('http://localhost:8000/blog/posts', {
          method: 'POST',
          credentials: 'include', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            title: newPost.title,
            content: newPost.content
          })
        })

        // Debug the token
        console.log('Access Token:', session.user.accessToken)
  
        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to create post:', errorData)
            return
        }
  
        const createdPost = await response.json()
        setPosts([createdPost, ...posts]) 
        setNewPost({ title: '', content: '' })
        setIsCreating(false)
  
    } catch (error) {
        console.error('Error creating post:', error)
    }
  }

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.accessToken || !editingPost) return;
  
    try {
      const response = await fetch(`http://localhost:8000/blog/posts/${editingPost._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update post:', errorData);
        return;
      }
  
      const updatedPost = await response.json();
      setPosts(posts.map(post => post._id === updatedPost._id ? updatedPost : post));
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    if (!session?.user?.accessToken) return;
  
    if (!window.confirm('Are you sure you want to delete this post?')) return;
  
    try {
      const response = await fetch(`http://localhost:8000/blog/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete post:', errorData);
        return;
      }
  
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Blog Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Create Post Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Post
          </button>
        </div>

        {/* Create Post Form */}
        {isCreating && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-black mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full p-2 border rounded h-32 text-black"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Publish Post
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white p-6 rounded-lg shadow-md">
              {editingPost?._id === post._id ? (
                <form onSubmit={handleEditPost} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editingPost.title}
                      onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                      className="w-full p-2 border rounded text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Content</label>
                    <textarea
                      value={editingPost.content}
                      onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                      className="w-full p-2 border rounded h-32 text-black"
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2 text-black">{post.title}</h2>
                  <p className="text-gray-600 mb-4">{post.content}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Posted on {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    {post.author_id === session?.user?.id &&(
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPost(post)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}