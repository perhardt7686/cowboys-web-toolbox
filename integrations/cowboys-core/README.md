# Existing private Core shell integration

These components are prepared for the existing custom-access Cowboy's Core site, not a second public Core.
They accept its current routes, action callbacks and authenticated Supabase client. No account records or credentials are bundled.

1. Copy this directory into the existing Core source.
2. Mount mountCoreNavigation with ALL current section descriptors. Use Overview (amber), Library (blue),
   Work (orange), People (violet), Toolbox (teal); keep Savage, PVF and Call & Haul as Workspaces in the menu.
   Existing additional routes remain in the searchable menu. Pass existing creation actions for New note,
   New task and receipt capture, plus sign-out/account settings only where the current shell supports them.
   Pinning and recents are device preferences; no server content is changed.
3. Mount mountPeopleResearch only for the People route, after the current Core authentication guard.
   Pass the existing client, then destroy the component on route changes.
4. Apply the service-specific Core migration, deploy the protected Edge gateway and verify the Render engine.
5. Test in the actual private site as owner and existing shared editor before publishing. Preserve custom-access permissions.

Example:
~~~js
import {mountCoreNavigation} from "./cowboys-core/navigation.mjs";
import {mountPeopleResearch} from "./cowboys-core/people-research.mjs";
const navigation=mountCoreNavigation({
  host:header,sections:existingSections,onNavigate:existingRouter,
  activeId:currentRoute,actions:existingQuickActions
});
const research=await mountPeopleResearch({host:content,client:existingSupabaseClient});
// On leaving People:
research.destroy();
~~~

The acceptance fixture is confined to services/core-people-research/tests. It uses synthetic records and
does not ship as a public frontend or query real people. The browser tests verify mobile menu reachability,
search/navigation, case creation, a single scan action, persisted review/notes, source links and overflow.
The full Core source checkout is still required to wire these components to its actual router and publish.
