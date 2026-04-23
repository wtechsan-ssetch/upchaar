import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase.js';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, CheckCircle, AlertCircle, Loader2, Mail, FileText, Camera, Upload } from 'lucide-react';
import { uploadAvatar } from '@/lib/uploadImage.js';
import ImageCropperModal from '@/components/ImageCropperModal.jsx';

export default function EditProfileModal({ isOpen, onClose, profile }) {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            setEmail(profile.email || '');
            setBio(profile.bio || '');
            setAvatarPreview(profile.avatar_url || null);
            setAvatarFile(null); // Reset file if profile changes
        }
    }, [profile]);

    // Handle video auto-attach
    useEffect(() => {
        if (isCameraOpen && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraOpen, stream]);

    // Cleanup camera tracks properly
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [stream]);

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const handleClose = () => {
        setError('');
        setSuccess(false);
        setAvatarFile(null);
        if (profile) setAvatarPreview(profile.avatar_url || null);
        closeCamera();
        onClose();
    };

    const openCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Camera error:", err);
            setError("Could not access camera. Please allow camera permissions.");
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/jpeg');
            setCropImageSrc(dataUrl);
            setCropperOpen(true);
            closeCamera();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError("Image must be less than 10MB");
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCropImageSrc(reader.result);
                setCropperOpen(true);
            });
            reader.readAsDataURL(file);
            setError('');
        }
        e.target.value = '';
    };

    const handleCropDone = (croppedFile, previewUrl) => {
        setAvatarFile(croppedFile);
        setAvatarPreview(previewUrl);
        setCropperOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!profile?.id) throw new Error('No active profile found.');

            let avatarUrl = profile.avatar_url;

            // Upload image if selected
            if (avatarFile) {
                avatarUrl = await uploadAvatar(avatarFile, profile.id);
            }

            // Update Auth user_metadata (we don't force update the actual auth email here as it requires confirmation, 
            // but we store it in user_metadata and DB so it shows up in profile)
            const { error: authErr } = await supabase.auth.updateUser({
                data: { full_name: fullName, phone: phone, bio: bio, email: email, avatar_url: avatarUrl }
            });
            if (authErr) throw authErr;

            // Update public.profiles
            const { error: dbErr } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone,
                    email: email,
                    bio: bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (dbErr) throw dbErr;

            setSuccess(true);
            setTimeout(() => {
                handleClose();
                window.location.reload(); // Reload to refresh all contexts
            }, 1000);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-sm">
                                        <User size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-800 text-base">Edit Profile</h2>
                                        <p className="text-xs text-slate-500">Update your complete profile Details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 overflow-y-auto">
                                {success ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-12 gap-3"
                                    >
                                        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle size={32} className="text-emerald-500" />
                                        </div>
                                        <p className="font-bold text-slate-800 text-lg">Profile Updated!</p>
                                        <p className="text-sm text-slate-500 text-center">
                                            Your changes have been saved successfully.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">

                                        {/* Profile Picture Upload */}
                                        <div className="flex flex-col items-center gap-3">
                                            {isCameraOpen ? (
                                                <div className="flex flex-col items-center gap-3 w-full bg-slate-900 rounded-2xl overflow-hidden p-4 relative animate-in zoom-in-95 duration-200 shadow-inner">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-56 object-cover rounded-xl bg-black" />
                                                    <canvas ref={canvasRef} className="hidden" />
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <button type="button" onClick={closeCamera} className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                                                            Cancel
                                                        </button>
                                                        <button type="button" onClick={capturePhoto} className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors shadow-sm">
                                                            <Camera size={14} /> Capture Photo
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-24 h-24 rounded-2xl aspect-square border-4 border-slate-50 shadow-sm bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                                        {avatarPreview ? (
                                                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={32} className="text-slate-300" />
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {/* Hidden inputs */}
                                                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

                                                        <button type="button" onClick={openCamera} className="text-xs flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors">
                                                            <Camera size={14} /> Camera
                                                        </button>
                                                        <button type="button" onClick={() => fileInputRef.current.click()} className="text-xs flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors">
                                                            <Upload size={14} /> Browse
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            {/* Full Name */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                                                <div className="relative">
                                                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-2.5 pl-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white" required />
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                                                <div className="relative">
                                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full px-4 py-2.5 pl-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white" required />
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                                                <div className="relative">
                                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your phone number" className="w-full px-4 py-2.5 pl-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white" required />
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                                </div>
                                            </div>

                                            {/* Bio */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio / Description</label>
                                                <div className="relative">
                                                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a short description about yourself..." rows={3} className="w-full px-4 py-2.5 pl-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-slate-50 focus:bg-white resize-none" />
                                                    <FileText className="absolute left-3 top-3.5 text-slate-400 h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={loading || (!fullName.trim() && !phone.trim() && !email.trim())} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-teal-500 hover:opacity-90 transition shadow-sm shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
                                                {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Image Cropper Modal (Rendered on top of Edit Profile Modal) */}
                    <ImageCropperModal
                        isOpen={cropperOpen}
                        onClose={() => setCropperOpen(false)}
                        imageSrc={cropImageSrc}
                        onCropDone={handleCropDone}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
