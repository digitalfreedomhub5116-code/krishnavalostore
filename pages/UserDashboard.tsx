
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { StorageService } from '../services/storage';
import { User, Booking, BookingStatus, Account, Message } from '../types';
import { 
  User as UserIcon, Clock, History, LifeBuoy, LogOut, 
  Gamepad2, Copy, Eye, EyeOff, ShieldCheck, 
  AlertTriangle, ChevronRight, MessageCircle, Award, Sparkles, Lock, ListPlus, Edit2, Trash2,
  Inbox, CheckCircle2, XCircle, Key, Send, Hash, ArrowLeft
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rentals' | 'listings' | 'requests' | 'messages' | 'history' | 'profile' | 'support' | 'rewards'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myListings, setMyListings] = useState<Account[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat State
  const [conversations, setConversations] = useState<{userId: string, userName: string, accountId: string, accountName: string, lastMessage: Message, unreadCount: number}[]>([]);
  const [activeChat, setActiveChat] = useState<{userId: string, userName: string, accountId: string, accountName: string} | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Password Edit Modal
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const currentUser = StorageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch My Rentals
        const userBookings = await StorageService.getUserBookings(currentUser.id);
        userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(userBookings);

        // Fetch My Listings
        const listings = await StorageService.getUserListings(currentUser.id);
        setMyListings(listings);

        // Fetch Incoming Booking Requests for my listings
        const allBookings = await StorageService.getBookings();
        const myAccountIds = new Set(listings.map(l => l.id));
        const requests = allBookings.filter(b => myAccountIds.has(b.accountId));
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIncomingRequests(requests);

        // Load Conversations
        await loadConversations(currentUser.id);
      }
      setLoading(false);
    };
    loadData();
    
    // Check for direct chat link in location state
    if (location.state && location.state.tab === 'messages') {
        setActiveTab('messages');
        const { chatWith, accountId } = location.state;
        if (chatWith && accountId) {
            // Find account name
            StorageService.getAccountById(accountId).then(acc => {
                const name = acc?.name || 'Unknown Account';
                // Try to find existing user name if possible, else generic
                // In real app, we'd fetch user profile. Here using placeholder.
                const userName = 'User ' + chatWith.substring(0, 4); 
                openChat({ userId: chatWith, userName, accountId, accountName: name });
            });
        }
    }

    const unsubscribe = StorageService.subscribe(loadData);
    return () => { unsubscribe(); };
  }, [location.state]);

  const loadConversations = async (userId: string) => {
      const allMsgs = await StorageService.getAllUserMessages(userId);
      const convMap = new Map<string, {userId: string, userName: string, accountId: string, accountName: string, lastMessage: Message, unreadCount: number}>();

      for (const msg of allMsgs) {
          const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
          const key = `${otherId}-${msg.accountId}`;
          
          if (!convMap.has(key)) {
              convMap.set(key, {
                  userId: otherId,
                  userName: 'User ' + otherId.substring(0, 4), // Placeholder name
                  accountId: msg.accountId,
                  accountName: msg.accountName || 'Valorant ID',
                  lastMessage: msg,
                  unreadCount: 0
              });
          }
          
          const conv = convMap.get(key)!;
          if (msg.receiverId === userId && !msg.isRead) {
              conv.unreadCount++;
          }
      }
      setConversations(Array.from(convMap.values()));
  };

  // Poll messages when chat is active
  useEffect(() => {
      if (!activeChat || !user) return;
      
      const pollMessages = async () => {
          const msgs = await StorageService.getMessages(user.id, activeChat.userId, activeChat.accountId);
          setMessages(msgs);
          
          // Mark as read
          if (msgs.some(m => m.receiverId === user.id && !m.isRead)) {
              await StorageService.markMessagesAsRead(activeChat.userId, user.id, activeChat.accountId);
              loadConversations(user.id); // Refresh counts
          }
      };

      pollMessages();
      const interval = setInterval(pollMessages, 3000);
      return () => clearInterval(interval);
  }, [activeChat, user]);

  useEffect(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    StorageService.logoutUser();
    navigate('/');
  };

  const handleDeleteListing = async (id: string) => {
    if(window.confirm("Are you sure you want to delete this listing?")) {
      await StorageService.deleteAccount(id);
    }
  };

  const handleAuthorize = async (booking: Booking) => {
     if(window.confirm("Authorize this booking? Credentials will be revealed to the renter.")) {
        // If start time is future, use PRE_BOOKED, else ACTIVE
        const isFuture = new Date(booking.startTime).getTime() > Date.now();
        const status = isFuture ? BookingStatus.PRE_BOOKED : BookingStatus.ACTIVE;
        try {
           await StorageService.updateBookingStatus(booking.orderId, status);
        } catch (e: any) {
           alert(e.message);
        }
     }
  };

  const handleCancelBooking = async (orderId: string) => {
     if(window.confirm("Reject this booking request?")) {
        await StorageService.updateBookingStatus(orderId, BookingStatus.CANCELLED);
     }
  };

  const handleSavePassword = async () => {
     if (editingPasswordId && newPassword) {
        await StorageService.updateAccountPassword(editingPasswordId, newPassword);
        setEditingPasswordId(null);
        setNewPassword('');
        alert("Password updated successfully.");
     }
  };

  const openChat = (chat: {userId: string, userName: string, accountId: string, accountName: string}) => {
      setActiveChat(chat);
      // Mobile view handling: CSS classes will hide list
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !activeChat || !user) return;

      const msg: Message = {
          id: 'MSG-' + Date.now(),
          senderId: user.id,
          receiverId: activeChat.userId,
          accountId: activeChat.accountId,
          accountName: activeChat.accountName,
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
          isRead: false
      };

      await StorageService.sendMessage(msg);
      setMessages([...messages, msg]);
      setNewMessage('');
      loadConversations(user.id);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const activeBookings = bookings.filter(b => b.status === BookingStatus.ACTIVE || b.status === BookingStatus.PENDING || b.status === BookingStatus.PRE_BOOKED);
  const pastBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CANCELLED);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Ultra Points Hero */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-brand-surface border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award size={120} className="text-yellow-500 rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-yellow-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                     <Sparkles size={14} /> Ultra Wallet
                  </div>
                  <div className="flex items-end gap-3 mb-6">
                     <div className="text-5xl font-display font-black text-white">{user.ultraPoints || 0}</div>
                     <div className="text-yellow-500 font-bold mb-1 uppercase tracking-widest text-xs">Points</div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('rewards')}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-brand-darker font-black text-[10px] rounded-lg transition-all uppercase tracking-widest"
                  >
                    View Rewards
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-surface border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-white mb-1">{activeBookings.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">Active/Upcoming</div>
              </div>
              <div className="bg-brand-surface border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-brand-accent mb-1">{pastBookings.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">History</div>
              </div>
            </div>

            {activeBookings.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   Current Sessions
                </h3>
                {activeBookings.map(booking => (
                  <RentalCard key={booking.orderId} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="bg-brand-surface/50 border border-dashed border-white/10 rounded-xl p-8 text-center">
                 <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">No Active Rentals</h3>
                 <p className="text-slate-400 text-sm mb-6">Ready to dominate the lobby? Rent a premium ID now.</p>
                 <button 
                   onClick={() => navigate('/browse')}
                   className="px-6 py-3 bg-brand-accent hover:bg-red-600 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-2"
                 >
                   Browse Inventory <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
            )}
          </div>
        );
      
      case 'messages':
          return (
              <div className="h-[600px] flex flex-col md:flex-row bg-brand-surface border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Conversations List */}
                  <div className={`w-full md:w-1/3 border-r border-white/10 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                      <div className="p-4 border-b border-white/10 bg-brand-dark/50">
                          <h3 className="font-bold text-white flex items-center gap-2"><MessageCircle size={18} /> Messages</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                          {conversations.length === 0 ? (
                              <div className="p-8 text-center text-slate-500 text-sm">No messages yet.</div>
                          ) : (
                              conversations.map((conv, idx) => (
                                  <div 
                                      key={idx}
                                      onClick={() => openChat(conv)}
                                      className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${activeChat?.userId === conv.userId && activeChat?.accountId === conv.accountId ? 'bg-brand-accent/10 border-l-2 border-l-brand-accent' : ''}`}
                                  >
                                      <div className="flex justify-between items-start mb-1">
                                          <div className="font-bold text-slate-200 text-sm truncate pr-2">{conv.userName}</div>
                                          {conv.unreadCount > 0 && <span className="bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{conv.unreadCount}</span>}
                                      </div>
                                      <div className="text-[10px] text-brand-cyan font-mono mb-1 truncate">{conv.accountName}</div>
                                      <div className="text-xs text-slate-500 truncate">{conv.lastMessage.content}</div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Chat Area */}
                  <div className={`w-full md:w-2/3 flex flex-col bg-brand-dark/30 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                      {activeChat ? (
                          <>
                              {/* Chat Header */}
                              <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-brand-surface">
                                  <button onClick={() => setActiveChat(null)} className="md:hidden text-slate-400 hover:text-white"><ArrowLeft size={20} /></button>
                                  <div className="w-8 h-8 rounded-full bg-brand-dark border border-white/10 flex items-center justify-center">
                                      <UserIcon size={16} className="text-slate-400" />
                                  </div>
                                  <div className="overflow-hidden">
                                      <div className="font-bold text-white text-sm">{activeChat.userName}</div>
                                      <div className="text-[10px] text-brand-cyan font-mono flex items-center gap-1">
                                          <Hash size={10} /> Re: {activeChat.accountName}
                                      </div>
                                  </div>
                              </div>

                              {/* Messages */}
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                  {messages.map(msg => {
                                      const isMe = msg.senderId === user.id;
                                      return (
                                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-brand-accent text-white rounded-br-none' : 'bg-brand-surface border border-white/10 text-slate-300 rounded-bl-none'}`}>
                                                  <div className="break-words">{msg.content}</div>
                                                  <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-slate-500'}`}>
                                                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                      {isMe && <span className="ml-1 opacity-70">{msg.isRead ? '• Read' : '• Sent'}</span>}
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                                  <div ref={chatBottomRef} />
                              </div>

                              {/* Input */}
                              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-brand-surface flex gap-2">
                                  <input 
                                      type="text" 
                                      value={newMessage}
                                      onChange={e => setNewMessage(e.target.value)}
                                      placeholder="Type a message..."
                                      className="flex-1 bg-brand-dark border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:border-brand-accent outline-none transition-colors"
                                  />
                                  <button 
                                      type="submit" 
                                      disabled={!newMessage.trim()}
                                      className="p-2.5 bg-brand-accent text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                      <Send size={18} />
                                  </button>
                              </form>
                          </>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                              <MessageCircle size={48} className="mb-4 opacity-20" />
                              <p>Select a conversation to start chatting</p>
                          </div>
                      )}
                  </div>
              </div>
          );

      case 'listings':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-white">My Listed IDs</h2>
               <button 
                 onClick={() => navigate('/list-account')}
                 className="px-4 py-2 bg-brand-cyan text-brand-dark font-bold rounded-lg uppercase text-xs tracking-wider hover:bg-white transition-colors flex items-center gap-2"
               >
                 <ListPlus size={16} /> List New ID
               </button>
             </div>

             {myListings.length === 0 ? (
               <div className="bg-brand-surface border border-dashed border-white/10 rounded-xl p-8 text-center">
                  <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">You haven't listed any accounts yet.</p>
               </div>
             ) : (
               <div className="grid gap-4">
                  {myListings.map(listing => (
                    <div key={listing.id} className="bg-brand-surface border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                       <div className="w-20 h-20 bg-black rounded-lg border border-white/5 overflow-hidden shrink-0">
                          <img src={listing.imageUrl} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{listing.name}</h3>
                          <p className="text-xs text-brand-cyan font-mono uppercase tracking-wide">{listing.rank} // {listing.region || 'Global'}</p>
                          <div className="mt-2 flex gap-2 text-[10px] text-slate-500 font-mono">
                             <span className="bg-white/5 px-2 py-1 rounded">1h: ₹{listing.pricing.hours1}</span>
                             <span className="bg-white/5 px-2 py-1 rounded">24h: ₹{listing.pricing.hours24}</span>
                          </div>
                       </div>
                       <div className="flex flex-col gap-2">
                          <button onClick={() => setEditingPasswordId(listing.id)} className="p-2 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white rounded transition-colors" title="Edit Password">
                             <Key size={16} />
                          </button>
                          <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Delete Listing">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        );

      case 'requests':
         return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-xl font-bold text-white mb-4">Booking Requests</h2>
               {incomingRequests.length === 0 ? (
                  <div className="bg-brand-surface border border-dashed border-white/10 rounded-xl p-8 text-center">
                     <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                     <p className="text-slate-400 text-sm">No incoming booking requests.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {incomingRequests.map(req => {
                        const isPending = req.status === BookingStatus.PENDING;
                        return (
                           <div key={req.orderId} className={`bg-brand-surface border rounded-xl p-5 ${isPending ? 'border-brand-accent/50 shadow-[0_0_15px_rgba(255,70,85,0.1)]' : 'border-white/10 opacity-75 hover:opacity-100 transition-opacity'}`}>
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-dark border border-white/10 flex items-center justify-center">
                                       <Gamepad2 className="w-5 h-5 text-brand-cyan" />
                                    </div>
                                    <div>
                                       <div className="font-bold text-white">{req.accountName}</div>
                                       <div className="text-[10px] text-slate-500 font-mono">{req.orderId}</div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider inline-block ${req.status === BookingStatus.PENDING ? 'bg-yellow-500/10 text-yellow-500' : req.status === BookingStatus.ACTIVE || req.status === BookingStatus.PRE_BOOKED ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                       {req.status}
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-xs mb-4 p-3 bg-brand-dark rounded-lg border border-white/5">
                                 <div>
                                    <div className="text-slate-500 font-bold uppercase text-[9px] mb-1">Renter</div>
                                    <div className="text-white">{req.customerName || 'Guest'}</div>
                                 </div>
                                 <div>
                                    <div className="text-slate-500 font-bold uppercase text-[9px] mb-1">Duration</div>
                                    <div className="text-white">{req.durationLabel} ({req.hours}h)</div>
                                 </div>
                                 <div>
                                    <div className="text-slate-500 font-bold uppercase text-[9px] mb-1">Payment Ref</div>
                                    <div className="text-brand-cyan font-mono select-all">{req.utr}</div>
                                 </div>
                                 <div>
                                    <div className="text-slate-500 font-bold uppercase text-[9px] mb-1">Price</div>
                                    <div className="text-brand-accent font-bold">₹{req.totalPrice}</div>
                                 </div>
                              </div>

                              {isPending && (
                                 <div className="flex gap-3">
                                    <button 
                                       onClick={() => handleAuthorize(req)}
                                       className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                    >
                                       <CheckCircle2 size={14} /> Authorize & Unlock
                                    </button>
                                    <button 
                                       onClick={() => handleCancelBooking(req.orderId)}
                                       className="flex-1 py-3 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-red-600/20 hover:border-red-600"
                                    >
                                       <XCircle size={14} /> Decline
                                    </button>
                                 </div>
                              )}
                              {(req.status === BookingStatus.ACTIVE || req.status === BookingStatus.PRE_BOOKED) && (
                                 <button 
                                    onClick={() => handleCancelBooking(req.orderId)}
                                    className="w-full py-2 bg-brand-dark hover:bg-red-900/20 text-slate-400 hover:text-red-400 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all border border-white/5"
                                 >
                                    Terminate Session
                                 </button>
                              )}
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         );

      case 'rewards':
        const pointsProgress = Math.min((user.ultraPoints / 500) * 100, 100);
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-brand-surface border border-white/10 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                   <div>
                      <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tight mb-2">Reward Milestones</h2>
                      <p className="text-slate-400 text-sm">Reach 500 Ultra Points to claim your first reward.</p>
                   </div>
                   <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-center min-w-[120px]">
                      <div className="text-2xl font-black text-yellow-500">{user.ultraPoints || 0}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Balance</div>
                   </div>
                </div>

                <div className="space-y-12">
                   {/* milestone 1 */}
                   <div className={`relative p-6 rounded-2xl border transition-all ${user.ultraPoints >= 500 ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-brand-dark/50 border-white/5 opacity-60'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.ultraPoints >= 500 ? 'bg-yellow-500 text-brand-dark' : 'bg-white/5 text-slate-500'}`}>
                               <Award size={24} />
                            </div>
                            <div>
                               <h3 className="font-bold text-white uppercase tracking-widest text-sm">Elite Valorant Voucher</h3>
                               <p className="text-[10px] text-slate-500 uppercase tracking-widest">1000 VP Code Delivery</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-lg font-black text-white">500 UP</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Required</div>
                         </div>
                      </div>
                      
                      <div className="h-2 bg-brand-dark rounded-full overflow-hidden mb-6 border border-white/5">
                         <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${pointsProgress}%` }} />
                      </div>

                      <button 
                        disabled={user.ultraPoints < 500}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all
                          ${user.ultraPoints >= 500 
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-brand-dark shadow-lg shadow-yellow-500/20' 
                            : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                          }`}
                      >
                        {user.ultraPoints >= 500 ? 'CLAIM 1000 VP VOUCHER' : `${500 - user.ultraPoints} POINTS REMAINING`}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'rentals':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-4">My Rentals</h2>
            {activeBookings.length === 0 && (
              <p className="text-slate-500 text-center py-10">You have no active rentals.</p>
            )}
            {activeBookings.map(booking => (
              <RentalCard key={booking.orderId} booking={booking} showCredentials={true} />
            ))}
          </div>
        );

      case 'history':
        return (
           <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-bold text-white mb-4">Booking History</h2>
             {pastBookings.length === 0 ? (
               <p className="text-slate-500 text-center py-10">No history found.</p>
             ) : (
                <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-slate-400">
                           <tr>
                             <th className="p-4">Order ID</th>
                             <th className="p-4">Account</th>
                             <th className="p-4">Date</th>
                             <th className="p-4">Status</th>
                             <th className="p-4 text-right">Price</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {pastBookings.map(b => (
                             <tr key={b.orderId} className="hover:bg-white/5">
                               <td className="p-4 font-mono">{b.orderId}</td>
                               <td className="p-4 text-white font-medium">{b.accountName}</td>
                               <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                               <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                     ${b.status === BookingStatus.COMPLETED ? 'bg-slate-700 text-slate-300' : 'bg-red-900/50 text-red-300'}
                                  `}>
                                     {b.status}
                                  </span>
                               </td>
                               <td className="p-4 text-right font-bold text-white">₹{b.totalPrice}</td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                   </div>
                </div>
             )}
           </div>
        );

      case 'profile':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-brand-surface border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center mb-8">
                   <div className="w-24 h-24 rounded-full border-2 border-brand-accent p-1 mb-4">
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full bg-brand-dark object-cover" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                   <p className="text-slate-400">{user.email}</p>
                   <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online
                   </div>
                </div>
                
                <div className="space-y-4 border-t border-white/10 pt-6">
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Account ID</div>
                      <div className="font-mono text-white text-sm">{user.id}</div>
                   </div>
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Ultra Points</div>
                      <div className="font-mono text-yellow-500 text-sm font-bold">{user.ultraPoints || 0} UP</div>
                   </div>
                   <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="text-sm text-slate-400">Member Since</div>
                      <div className="font-mono text-white text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                   </div>
                </div>
             </div>
          </div>
        );
        
      case 'support':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
             <div className="bg-brand-surface border border-white/10 rounded-xl p-8 text-center mb-6">
                <LifeBuoy className="w-16 h-16 text-brand-cyan mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Need Help?</h2>
                <p className="text-slate-400 mb-6">Our support team is available 24/7 via WhatsApp.</p>
                <button 
                  onClick={() => window.open('https://wa.me/919860185116', '_blank')}
                  className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </button>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-brand-surface border border-white/10 rounded-xl overflow-hidden sticky top-24">
             <div className="p-6 border-b border-white/10 bg-gradient-to-br from-brand-accent/20 to-transparent">
               <div className="flex items-center gap-3">
                  <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                  <div className="overflow-hidden">
                     <div className="font-bold text-white truncate">{user.name}</div>
                     <div className="text-xs text-slate-400 truncate uppercase tracking-tighter">{user.role} // {user.ultraPoints} UP</div>
                  </div>
               </div>
             </div>
             
             <nav className="p-2 space-y-1">
               {[
                 { id: 'overview', icon: Gamepad2, label: 'Dashboard' },
                 { id: 'messages', icon: MessageCircle, label: 'Messages', count: conversations.reduce((acc, c) => acc + c.unreadCount, 0) },
                 { id: 'listings', icon: ListPlus, label: 'My Listed IDs' },
                 { id: 'requests', icon: Inbox, label: 'Incoming Requests', count: incomingRequests.filter(r => r.status === BookingStatus.PENDING).length },
                 { id: 'rewards', icon: Award, label: 'Ultra Rewards' },
                 { id: 'rentals', icon: Clock, label: 'My Rentals' },
                 { id: 'history', icon: History, label: 'Booking History' },
                 { id: 'profile', icon: UserIcon, label: 'Profile' },
                 { id: 'support', icon: LifeBuoy, label: 'Support' },
               ].map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id as any)}
                   className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                     ${activeTab === item.id 
                       ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                       : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }
                   `}
                 >
                   <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                   </div>
                   {item.count && item.count > 0 ? (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">{item.count}</span>
                   ) : null}
                 </button>
               ))}
               
               <div className="pt-2 mt-2 border-t border-white/5">
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                 >
                   <LogOut className="w-4 h-4" />
                   Log Out
                 </button>
               </div>
             </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[500px]">
           {renderTabContent()}
        </main>
      </div>

      {/* Password Edit Modal */}
      {editingPasswordId && createPortal(
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-brand-surface border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
               <h3 className="text-lg font-bold text-white mb-4">Update ID Password</h3>
               <p className="text-slate-400 text-xs mb-4">The new password will be revealed to renters after authorization.</p>
               <input 
                  type="text" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Enter new password"
                  className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-white mb-4 focus:border-brand-accent outline-none font-mono"
               />
               <div className="flex gap-3">
                  <button onClick={() => setEditingPasswordId(null)} className="flex-1 py-3 border border-white/10 rounded-lg text-slate-400 hover:text-white font-bold text-xs uppercase">Cancel</button>
                  <button onClick={handleSavePassword} className="flex-1 py-3 bg-brand-accent hover:bg-red-600 rounded-lg text-white font-bold text-xs uppercase shadow-lg">Save</button>
               </div>
            </div>
         </div>,
         document.body
      )}
    </div>
  );
};

// --- Sub-Components ---

const RentalCard: React.FC<{ booking: Booking, showCredentials?: boolean }> = ({ booking, showCredentials }) => {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [timeLabel, setTimeLabel] = useState<string>('Time Remaining');
  const [progress, setProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [accountDetails, setAccountDetails] = useState<Account | undefined>(undefined);
  const [bookingState, setBookingState] = useState<'PENDING' | 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'OTHER'>('PENDING');

  useEffect(() => {
    const fetchAccount = async () => {
      if (showCredentials) {
         const acc = await StorageService.getAccountById(booking.accountId);
         setAccountDetails(acc);
      }
    };
    fetchAccount();
  }, [booking.accountId, showCredentials]);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (booking.status === BookingStatus.PENDING) {
        setBookingState('PENDING');
        return;
    }
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
        setBookingState('OTHER');
        return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(booking.endTime).getTime();
      const start = new Date(booking.startTime).getTime();
      
      if (now < start) {
         // Upcoming (Pre-Booked)
         setBookingState('UPCOMING');
         const diff = start - now;
         setTimeLeft(formatTime(diff));
         setTimeLabel('Starts In');
         setProgress(0);
      } else if (now < end) {
         // Active
         setBookingState('ACTIVE');
         const totalDuration = end - start;
         const remaining = end - now;
         
         setTimeLeft(formatTime(remaining));
         setTimeLabel('Active: Ends in');
         
         const percent = Math.max(0, (remaining / totalDuration) * 100);
         setProgress(percent);
      } else {
         // Expired
         setBookingState('EXPIRED');
         setTimeLeft("EXPIRED");
         setTimeLabel("Status");
         setProgress(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const startDateObj = new Date(booking.startTime);
  const startDisplay = `${startDateObj.toLocaleDateString()} ${startDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

  return (
    <div className={`bg-brand-surface border rounded-xl overflow-hidden relative group transition-all duration-300 ${bookingState === 'ACTIVE' ? 'border-brand-accent/50 shadow-[0_0_20px_rgba(255,70,85,0.1)]' : 'border-white/10'}`}>
      
      {/* Progress Bar (Only for Active) */}
      <div className="h-1 bg-gray-800 w-full">
         <div 
           className={`h-full transition-all duration-1000 ease-linear ${progress < 20 ? 'bg-red-500' : 'bg-brand-accent'}`} 
           style={{ width: `${progress}%` }}
         />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="font-bold text-xl text-white mb-1">{booking.accountName}</h3>
             <div className="flex items-center gap-2 text-sm text-slate-400">
               <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">{booking.orderId}</span>
               <span>•</span>
               <span>{booking.durationLabel}</span>
             </div>
           </div>
           
           <div className="text-right">
              {bookingState === 'ACTIVE' || bookingState === 'UPCOMING' ? (
                 <>
                   <div className="text-sm text-slate-400 uppercase tracking-wide text-[10px] font-bold">{timeLabel}</div>
                   <div className={`text-2xl font-mono font-bold tabular-nums tracking-tight ${bookingState === 'UPCOMING' ? 'text-purple-400' : 'text-brand-cyan'}`}>
                      {timeLeft}
                   </div>
                   {bookingState === 'UPCOMING' && (
                      <div className="text-[10px] text-purple-300 font-mono mt-1 font-bold">
                        Pre-booked: Starts on {startDisplay}
                      </div>
                   )}
                 </>
              ) : (
                <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase ${booking.status === BookingStatus.CANCELLED ? 'bg-slate-700/50 text-slate-400 border-white/10' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                  {booking.status}
                </span>
              )}
           </div>
        </div>

        {/* Credentials Section - Only show if Active AND showCredentials is true */}
        {showCredentials && bookingState === 'ACTIVE' && accountDetails && (
          <div className="mt-6 bg-brand-dark/50 border border-white/5 rounded-lg p-4 relative overflow-hidden animate-in fade-in zoom-in-95">
             
             {!isRevealed ? (
               <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/60 flex flex-col items-center justify-center text-center p-4">
                  <ShieldCheck className="w-8 h-8 text-brand-accent mb-2" />
                  <h4 className="text-white font-bold mb-1">Secure Credentials</h4>
                  <p className="text-xs text-slate-400 mb-3 max-w-[250px]">
                    Do not share these details. Misuse will result in an immediate ban.
                  </p>
                  <button 
                    onClick={() => setIsRevealed(true)}
                    className="px-4 py-2 bg-white text-black font-bold text-sm rounded hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Reveal Login
                  </button>
               </div>
             ) : (
               <div className="absolute top-2 right-2 z-20">
                  <button onClick={() => setIsRevealed(false)} className="text-slate-500 hover:text-white p-1">
                     <EyeOff className="w-4 h-4" />
                  </button>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Username</label>
                   <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 group/field">
                      <code className="flex-1 text-sm font-mono text-brand-cyan truncate">{accountDetails.username || 'Hidden'}</code>
                      <button onClick={() => copyToClipboard(accountDetails.username || '')} className="text-slate-500 hover:text-white opacity-0 group-hover/field:opacity-100 transition-opacity">
                         <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Password</label>
                   <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 group/field">
                      <code className="flex-1 text-sm font-mono text-brand-cyan truncate">{accountDetails.password || '********'}</code>
                      <button onClick={() => copyToClipboard(accountDetails.password || '')} className="text-slate-500 hover:text-white opacity-0 group-hover/field:opacity-100 transition-opacity">
                         <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
             
             {isRevealed && (
               <div className="mt-3 flex items-start gap-2 text-xs text-yellow-500/80 bg-yellow-500/5 p-2 rounded">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <p>Do not change the email or password. The system auto-detects changes and will lock your account.</p>
               </div>
             )}
          </div>
        )}

        {/* Pre-Book Locked State - Replaces Credentials when UPCOMING */}
        {showCredentials && bookingState === 'UPCOMING' && (
            <div className="mt-6 bg-purple-500/5 border border-purple-500/20 rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/5 blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-purple-400 animate-pulse" />
                    </div>
                    <h4 className="text-white font-bold mb-1 uppercase tracking-wide">Credentials Locked</h4>
                    <p className="text-slate-400 text-xs max-w-xs mb-3">
                        This is a pre-booked session. Login details will be automatically revealed when the timer hits zero.
                    </p>
                    <div className="text-purple-300 font-mono text-sm font-bold bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                       Your booking starts in: {timeLeft}
                    </div>
                </div>
            </div>
        )}

        {bookingState === 'PENDING' && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
               <Clock className="w-4 h-4 text-blue-400 animate-spin-slow" />
             </div>
             <div>
               <p className="text-sm font-bold text-blue-100">Verification Pending</p>
               <p className="text-xs text-blue-300/70">Admin is verifying your payment. Refresh in 2-5 mins.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
