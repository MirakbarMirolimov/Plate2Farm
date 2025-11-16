# 🚀 Supabase Storage Setup for Plate2Farm

## ✅ CORRECT WAY - Storage Policies (Not RLS)

### Step 1: Go to Supabase Dashboard
1. **Storage** → **Buckets** → **plate2farm_images** → **Policies**

### Step 2: Add Storage Policies

#### 1️⃣ Public Read Policy
- **Operation:** Select
- **Target:** Public  
- **Policy Expression:**
```
(bucket_id = 'plate2farm_images')
```
- Click **Save**

#### 2️⃣ Authenticated Upload Policy  
- **Operation:** Insert
- **Target:** Authenticated
- **Policy Expression:**
```
(bucket_id = 'plate2farm_images')
```
- Click **Save**

### Step 3: Verify Bucket Settings
- **Storage** → **plate2farm_images** → **Settings** 
- **Public:** ✅ **ON** (CRITICAL!)

---

## 🔍 Debugging Commands

If your bucket isn't working, run these in **SQL Editor**:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets;

-- Check current files  
SELECT * FROM storage.objects LIMIT 5;

-- Verify bucket is public
SELECT name, public FROM storage.buckets WHERE name = 'plate2farm_images';
```

---

## ❌ What NOT to Do

- ❌ Don't enable RLS manually on `storage.objects`
- ❌ Don't use database RLS policies for storage
- ❌ Don't forget to make bucket Public

---

## ✅ After Setup

Your `uploadImage()` function should work immediately with no RLS errors!
