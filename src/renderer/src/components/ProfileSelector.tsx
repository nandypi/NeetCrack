import { useEffect, useState } from 'react'
import { Check, ChevronDown, Trash2, UserRound } from 'lucide-react'
import { Popover } from 'radix-ui'
import { fetchCategories } from '@renderer/lib/content-client'
import { useProfileStore } from '@renderer/lib/profile-store'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import type { Profile } from '@shared/domain'

function CreateProfileForm({ onCreated }: { onCreated?: () => void }): React.JSX.Element {
  const [name, setName] = useState('')
  const createProfile = useProfileStore((state) => state.createProfile)
  const busy = useProfileStore((state) => state.busy)
  const error = useProfileStore((state) => state.error)
  const clearError = useProfileStore((state) => state.clearError)

  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault()
        if (await createProfile(name)) {
          setName('')
          onCreated?.()
        }
      }}
    >
      <label htmlFor="profile-name" className="text-xs font-medium text-neutral-400">
        New profile
      </label>
      <div className="flex gap-2">
        <input
          id="profile-name"
          value={name}
          maxLength={50}
          onChange={(event) => {
            setName(event.target.value)
            if (error) clearError()
          }}
          placeholder="Profile name"
          className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          autoComplete="off"
        />
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>
          Create
        </Button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  )
}

export function EmptyProfiles(): React.JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <UserRound className="mb-4 size-8 text-neutral-400" />
        <h1 className="text-xl font-semibold">Create your profile</h1>
        <p className="mt-2 mb-5 text-sm text-neutral-400">
          Profiles keep lesson progress separate on this device.
        </p>
        <CreateProfileForm />
      </div>
    </div>
  )
}

function ProfileSelector(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [totalLessons, setTotalLessons] = useState(0)
  const profiles = useProfileStore((state) => state.profiles)
  const activeProfileId = useProfileStore((state) => state.activeProfileId)
  const completedCount = useProfileStore((state) => Object.keys(state.progress.completed).length)
  const busy = useProfileStore((state) => state.busy)
  const selectProfile = useProfileStore((state) => state.selectProfile)
  const deleteProfile = useProfileStore((state) => state.deleteProfile)
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId)

  useEffect(() => {
    void fetchCategories()
      .then((categories) => {
        const courses = categories.flatMap((category) => category.courses)
        setTotalLessons(courses.reduce((sum, course) => sum + course.lessonCount, 0))
      })
      .catch(() => undefined)
  }, [])

  const percentage = totalLessons
    ? Math.min(100, Math.round((completedCount / totalLessons) * 100))
    : 0

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button variant="ghost" className="h-auto px-3 py-1.5" aria-label="Choose profile">
            <UserRound />
            <span className="text-left">
              <span className="block max-w-36 truncate">{activeProfile?.name ?? 'No profile'}</span>
              {activeProfile ? (
                <span className="block text-[11px] font-normal text-neutral-400">
                  {completedCount}/{totalLessons || '-'} lessons · {percentage}%
                </span>
              ) : null}
            </span>
            <ChevronDown className="text-neutral-400" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-50 w-72 rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-xl outline-none"
          >
            <p className="px-2 pb-2 text-xs font-medium text-neutral-500">Profiles</p>
            <div className="mb-3 max-h-56 space-y-1 overflow-y-auto">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group flex items-center rounded-md hover:bg-neutral-800"
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void selectProfile(profile.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm"
                  >
                    <span className="w-4">{profile.id === activeProfileId ? <Check /> : null}</span>
                    <span className="truncate">{profile.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(profile)}
                    className="mr-1 rounded p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400"
                    aria-label={`Delete ${profile.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-800 pt-3">
              <CreateProfileForm onCreated={() => setOpen(false)} />
            </div>
            <Popover.Arrow className="fill-neutral-800" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Dialog open={deleteTarget !== null} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the profile and all of its lesson progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!deleteTarget) return
                await deleteProfile(deleteTarget.id)
                setDeleteTarget(null)
                setOpen(false)
              }}
            >
              Delete profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProfileSelector
