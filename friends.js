
(function () {
  "use strict";

  const SUPABASE_URL =
    "https://rkubeolqhvztdfpfthok.supabase.co";

  // Replace this placeholder with your Supabase publishable key.
  const SUPABASE_KEY =
    "sb_publishable_u7bDaUIwUojCI80h7Mtw2w_LG1_l7hf";

  const PREVIEW_URL =
    SUPABASE_URL + "/functions/v1/preview-friend";

  function initFriends() {
    const form = document.getElementById("friend-form");
    const urlInput = document.getElementById("friend-url");
    const nameInput = document.getElementById("friend-name");
    const avatarInput = document.getElementById("friend-avatar");
    const descriptionInput =
      document.getElementById("friend-description");
    const previewButton = document.getElementById("friend-preview");
    const status = document.getElementById("friend-status");
    const list = document.getElementById("friends-list");

    if (
      !form || !urlInput || !nameInput || !avatarInput ||
      !descriptionInput || !previewButton || !status || !list
    ) {
      return;
    }

    // Prevent duplicate event handlers.
    if (form.dataset.friendsInitialized === "true") return;
    form.dataset.friendsInitialized = "true";

    if (
      !window.supabase ||
      SUPABASE_KEY === "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
    ) {
      status.textContent =
        "Friends is not configured yet. Check the Supabase key and script loading.";
      list.textContent = "Friends list is temporarily unavailable.";
      return;
    }

    const db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    function setStatus(message) {
      status.textContent = message;
    }

    function getHttpsUrl(value) {
      try {
        const url = new URL(value.trim());
        if (url.protocol !== "https:") return null;
        if (url.username || url.password) return null;
        return url.href;
      } catch {
        return null;
      }
    }

    // Automatically fetch website metadata.
    previewButton.addEventListener("click", async function () {
      const website = getHttpsUrl(urlInput.value);

      if (!website) {
        setStatus("Please enter a valid HTTPS website URL first.");
        return;
      }

      previewButton.disabled = true;
      setStatus("Fetching website information...");

      try {
        const response = await fetch(PREVIEW_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY
          },
          body: JSON.stringify({ url: website })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not fetch website information."
          );
        }

        // Keep the visitor's existing text if metadata is empty.
        urlInput.value = data.site_url || website;

        if (data.site_name) {
          nameInput.value = data.site_name;
        }

        if (data.avatar_url) {
          avatarInput.value = data.avatar_url;
        }

        if (data.description) {
          descriptionInput.value = data.description;
        }

        setStatus(
          "Website information fetched. Please check and edit it before submitting."
        );
      } catch (error) {
        console.error("Friend preview error:", error);
        setStatus(
          (error.message || "Automatic detection failed.") +
          " You can fill in the fields manually."
        );
      } finally {
        previewButton.disabled = false;
      }
    });

    // Submit a new friend link for review.
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const website = getHttpsUrl(urlInput.value);
      const siteName = nameInput.value.trim();
      const avatarValue = avatarInput.value.trim();
      const description = descriptionInput.value.trim();

      if (!website) {
        setStatus("Please enter a valid HTTPS website URL.");
        return;
      }

      if (!siteName || siteName.length > 100) {
        setStatus("Please enter a name of up to 100 characters.");
        return;
      }

      let avatarUrl = "";

      if (avatarValue) {
        avatarUrl = getHttpsUrl(avatarValue);

        if (!avatarUrl) {
          setStatus("The avatar URL must be a valid HTTPS URL.");
          return;
        }
      }

      if (description.length > 500) {
        setStatus("The description must be 500 characters or fewer.");
        return;
      }

      const submitButton = form.querySelector(
        'button[type="submit"]'
      );

      if (submitButton) submitButton.disabled = true;
      setStatus("Submitting your friend link...");

      try {
        const { error } = await db
          .from("friends")
          .insert({
            site_url: website,
            site_name: siteName,
            avatar_url: avatarUrl,
            description: description,
            approved: false
          });

        if (error) throw error;

        form.reset();
        setStatus(
          "Submitted successfully! Your link will appear after review."
        );
      } catch (error) {
        console.error("Friend submission error:", error);
        setStatus(
          "Submission failed. Please try again later."
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });

    // Display approved links only.
    async function loadFriends() {
      list.replaceChildren();

      const loading = document.createElement("p");
      loading.textContent = "Loading friends...";
      list.appendChild(loading);

      try {
        const { data, error } = await db
          .from("friends")
          .select("id, site_url, site_name, avatar_url, description")
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        list.replaceChildren();

        if (!data || data.length === 0) {
          const empty = document.createElement("p");
          empty.textContent =
            "No friends here yet. Be the first to leave your link!";
          list.appendChild(empty);
          return;
        }

        data.forEach(function (friend) {
          const card = document.createElement("article");
          card.className = "friend-card";

          const link = document.createElement("a");
          link.className = "friend-card-link";
          link.href = getHttpsUrl(friend.site_url) || "#";
          link.target = "_blank";
          link.rel = "noopener noreferrer";

          if (friend.avatar_url) {
            const avatarUrl = getHttpsUrl(friend.avatar_url);

            if (avatarUrl) {
              const avatar = document.createElement("img");
              avatar.className = "friend-avatar";
              avatar.src = avatarUrl;
              avatar.alt = "";
              avatar.loading = "lazy";
              avatar.referrerPolicy = "no-referrer";
              avatar.addEventListener("error", function () {
                avatar.remove();
              });
              link.appendChild(avatar);
            }
          }

          const info = document.createElement("div");
          info.className = "friend-info";

          const title = document.createElement("div");
          title.className = "friend-name";
          title.textContent = friend.site_name || "Untitled website";
          info.appendChild(title);

          if (friend.description) {
            const description = document.createElement("p");
            description.className = "friend-description";
            description.textContent = friend.description;
            info.appendChild(description);
          }

          const address = document.createElement("span");
          address.className = "friend-url";
          address.textContent = friend.site_url;
          info.appendChild(address);

          link.appendChild(info);
          card.appendChild(link);
          list.appendChild(card);
        });
      } catch (error) {
        console.error("Loading friends failed:", error);
        list.replaceChildren();

        const message = document.createElement("p");
        message.textContent =
          "Could not load friends right now. Please try again later.";
        list.appendChild(message);
      }
    }

    loadFriends();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFriends);
  } else {
    initFriends();
  }
})();
