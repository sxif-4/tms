This plan outlines the development of the **Hotel Module** for the Theme Park Island Online Booking System.

### **1. Module Overview and Goals**
The Hotel Module is the primary interface for **Hotel Managers and Staff** to manage the island's lodging inventory, which acts as the prerequisite for ferry travel. 

*   **Primary Goal:** To provide a comprehensive management suite for room availability, guest reservations, and marketing efforts.
*   **Target Interfaces:**
    *   **Hotel CRUD Management Dashboard:** For real-time room availability updates.
    *   **Booking Management Interface:** To create, update, and cancel guest stays.
    *   **Promotions and Advertisement Forms:** To input and manage special lodging offers.
    *   **Occupancy Reports View:** To track sales and visitor statistics.
*   **Role Context:** This module is strictly part of the system's **Role-Based Access Control (RBAC)**. Access is granted specifically to users authenticated as **hotel staff**, such as the test account `hotel@example.com` [User Query].

### **2. Frontend Architecture (TanStack Start)**
The frontend will utilize **TanStack Start** to handle server-side rendering and routing.

*   **Route Planning:**
    *   `/hotel/dashboard`: Central overview of room occupancy and active alerts.
    *   `/hotel/rooms`: CRUD interface for managing room types and availability.
    *   `/hotel/bookings`: Searchable list of reservations with lifecycle management (Update/Cancel).
    *   `/hotel/promotions`: Form-based interface for managing site-wide lodging ads.
    *   `/hotel/settings`: Account and profile management for the hotel staff role.
*   **Crucial Note:** Ensure the **frontend server remains running** during the creation of these routes so TanStack Start can automatically register and generate the necessary route files [User Query].

### **3. UI and Design Specifications**
To maintain consistency with the brand identity and the existing project repository, the following standards will be enforced:

*   **Component Usage:** All interactive elements (buttons, inputs, tables, and sidebars) must be built using **shadcn/ui** components [User Query, 55].
*   **Theme Adherence:** The interface will strictly follow the project’s **red, black, and white color palette** [User Query].
*   **Mode Support:** Designs must be fully responsive and support both **dark and light modes**, integrated with the existing header's toggle functionality [User Query, 322].
*   **UX Principles:** 
    *   **Feedback:** Implement loading states (loaders) and toast notifications for successful CRUD operations.
    *   **Error Prevention:** Use **date pickers** to ensure stay dates are formatted correctly for the database.
    *   **Visual Hierarchy:** Use clear typography and scale to distinguish between room categories and booking statuses.

### **4. Shared Resources**
The module will leverage internal workspace packages to ensure performance and standardization:

*   **`@repo/ui`**: To import and use existing shared React components developed for the "tms" project [User Query].
*   **`@repo/typescript-config`**: To ensure the module adheres to the project's global **TypeScript standards** and strict type checking [User Query]. 
*   **`@repo/utils`**: For shared date formatting and validation logic, particularly for checking stay dates against ferry rules.
