# Task: Add User Profiles and Per-Profile Progress

Create a lightweight profile system in the application.

## Context

This app **does not have authentication and does not need authentication**.

Profiles are only a local way to separate user learning progress. For example, when a user clicks **"Mark as completed"** on a lesson, that completion should belong to the currently selected profile.

Currently, the UI has a hard-coded:

> Profile: Nandy

Replace this with a functional profile selector.

## Requirements

### 1. Profile selector

* Add a profile selector in the **top-right corner** of the application.
* Show the currently selected profile.
* Clicking it should open a menu/popover where the user can:

  * View existing profiles
  * Select/switch profiles
  * Create a new profile
  * Delete an existing profile

### 2. Create profile

* Allow the user to create a profile by providing a name.
* Profile names should not be empty.
* Prevent accidental duplicate profiles if the existing app architecture makes this reasonable.
* After creating a profile, make the new profile the currently selected profile.

### 3. Select/switch profile

* Selecting a profile should immediately switch the active user context.
* All progress shown in the application should correspond to the currently selected profile.
* Switching profiles must not modify or lose another profile's progress.

### 4. Delete profile

* Allow profiles to be deleted.
* Deleting a profile should also remove that profile's associated progress.
* If the user deletes the currently selected profile, automatically select another existing profile.
* If no profiles remain, provide a sensible empty state and allow the user to create a new profile.
* Add a confirmation step before deleting a profile if the existing UI patterns support confirmations.

### 5. Progress tracking

* "Mark as completed" state must be stored **per profile**.
* Example:

  * Nandy completes Lesson A → Lesson A is completed for Nandy.
  * Switch to another profile → Lesson A should not appear completed unless that profile completed it.
  * Switch back to Nandy → Lesson A should still be completed.
* Preserve existing lesson/progress functionality as much as possible.

### 6. Progress UI

Show useful progress information wherever it naturally fits in the existing UI.

For example:

* Overall completion percentage
* Completed lessons / total lessons
* Progress indicators on courses/sections
* Profile-specific progress in the profile selector or profile area

Do not add progress UI everywhere just for the sake of it. Prefer locations that improve the existing UX and follow the application's current design language.

### 7. Persistence

Profiles and their progress should persist across page refreshes/reloads.

Use the application's **existing persistence/state approach if one already exists**. Do not introduce a new backend, authentication system, or unnecessary infrastructure.

## Constraints

* Do not add authentication.
* Do not add a backend unless the existing architecture absolutely requires it.
* Do not change unrelated functionality.
* Reuse existing components, styles, state management, utilities, and patterns where possible.
* Keep the implementation simple and consistent with the existing codebase.
* **Avoid unnecessary refactoring.**
* Do not rewrite unrelated files or components.
* Before making changes, inspect the existing architecture and identify the minimum set of files/components that need to change.

## Acceptance Criteria

* [ ] The hard-coded "Profile: Nandy" is replaced with a functional profile selector.
* [ ] Profile selector is available in the top-right corner.
* [ ] User can create a profile.
* [ ] User can select/switch between profiles.
* [ ] User can delete a profile.
* [ ] Deleting a profile also removes its associated progress.
* [ ] Progress is tracked independently for each profile.
* [ ] Switching profiles correctly updates all progress-related UI.
* [ ] Profiles and progress survive a page refresh.
* [ ] Existing "Mark as completed" functionality continues to work.
* [ ] Useful progress indicators are shown where appropriate.
* [ ] No authentication is introduced.
* [ ] Unrelated code and functionality are not changed.
* [ ] Existing UI/design patterns are reused where possible.
* [ ] No unnecessary refactoring is introduced.

## Implementation Guidance

Before coding:

1. Inspect the existing project structure and identify how lesson completion is currently stored.
2. Identify the existing state management and persistence mechanism.
3. Identify the current profile UI and the components responsible for progress.
4. Implement profiles using the existing architecture rather than introducing a new pattern.
5. Make the smallest reasonable set of changes needed to satisfy the requirements.
6. After implementation, verify the profile-switching and progress behavior for at least two profiles.

Do not ask me to make architectural decisions that can reasonably be inferred from the existing codebase. Inspect the code and choose the simplest approach consistent with the project.
