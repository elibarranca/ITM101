<script type="module">
  // --- FIREBASE IMPORTS ---
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
  import { getFirestore, doc, getDoc, collection, addDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
  import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
  
  setLogLevel('Debug');

  // --- GLOBAL CONFIG & STATE ---
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; 
  const apiKey = ""; // API Key placeholder for LLM fetch

  let app, db, auth;
  let currentUserId = null;
  let latestProjectId = null;

  // --- DOM REFERENCES ---
  const views = {
    home: document.getElementById('homeView'),
    configurator: document.getElementById('configuratorView'),
    materials: document.getElementById('materialsView'),
    instructions: document.getElementById('instructionsView')
  };

  const loginBtn = document.getElementById('loginBtn');
  const statusBox = document.getElementById('statusBox');
  const statusText = document.getElementById('statusText');

  // --- UTILITY FUNCTIONS ---

  function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusBox.className = isError ? 'error-box' : 'success-box';
    statusBox.classList.remove('hidden');
    setTimeout(() => statusBox.classList.add('hidden'), 5000);
  }

  /**
   * Attempts to fetch the last saved project ID for the current user.
   * Handles permission errors silently, as this often occurs when a user signs in for the first time.
   */
  async function getLatestProjectId(userId) {
    if (!db || !userId) return null;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', userId, 'config', 'latest');
      const docSnap = await getDoc(docRef);
      
      // Use optional chaining for safety
      if (docSnap.exists() && docSnap.data()?.latestProjectId) {
        return docSnap.data().latestProjectId;
      }
      return null; // Document is missing or data is malformed, return null silently.
    } catch(e) {
      // We catch the 'Missing or insufficient permissions' error, which happens when the config 
      // document doesn't exist for a new user, and treat it as a non-fatal event.
      if (e.code === 'permission-denied') {
          // Log as a warning to acknowledge the error but clearly mark it as non-fatal/expected for first-time users.
          console.warn("Expected FireStore Error: No 'latest' project ID found for new user.");
          return null;
      }
      console.error("Unexpected error fetching latest project ID:", e);
      return null;
    }
  }

  /**
   * Updates the project links on the home page based on whether a project exists.
   */
  function updateNavLinks(projectId) {
    const materialsLink = document.getElementById('viewMaterialsLink');
    const instructionsLink = document.getElementById('viewInstructionsLink');
    
    // The links rely on checkProject() if no ID exists, or navigateTo() if one does.
    if (projectId) {
      materialsLink.onclick = (e) => { e.preventDefault(); navigateTo('materials', projectId); return false; };
      instructionsLink.onclick = (e) => { e.preventDefault(); navigateTo('instructions', projectId); return false; };
    } else {
      // If no project ID, links will trigger the alert/status message via checkProject
      materialsLink.onclick = (e) => checkProject(e, 'materials');
      instructionsLink.onclick = (e) => checkProject(e, 'instructions');
    }
  }
  
  /**
   * Checks if a project exists before navigating to a detailed view.
   */
  window.checkProject = function(event, targetPage) {
      event.preventDefault();
      if (!latestProjectId) {
          showStatus('Please start a project in the configurator first!', true);
          return false;
      }
      navigateTo(targetPage, latestProjectId);
      return false;
  }

  // --- NAVIGATION AND RENDERING ---

  window.navigateTo = async function(page, projectId = null) {
    // Hide all views first
    Object.values(views).forEach(view => view.classList.add('hidden'));
    statusBox.classList.add('hidden'); // Clear status on navigation

    if (views[page]) {
      views[page].classList.remove('hidden');
      document.documentElement.scrollTop = 0; // Scroll to top

      // Call setup function for the target page
      if (page === 'home') {
        await setupHome();
      } else if (page === 'configurator') {
        setupConfigurator();
      } else if (page === 'materials' && projectId) {
        await setupMaterials(projectId);
      } else if (page === 'instructions' && projectId) {
        await setupInstructions(projectId);
      } else if ((page === 'materials' || page === 'instructions') && !projectId) {
          showStatus('Cannot navigate: No Project ID provided. Redirecting to home.', true);
          navigateTo('home');
      }
    } else {
      console.error('Invalid page requested:', page);
      navigateTo('home');
    }
  }

  // --- AUTHENTICATION HANDLERS ---

  async function handleLogin() {
    try {
      if (initialAuthToken) {
        await signInWithCustomToken(auth, initialAuthToken);
      } else {
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error("Login failed:", error.code, error.message);
      showStatus('Login failed. See console for details.', true);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      // After logout, onAuthStateChanged will handle UI update
    } catch (error) {
      console.error("Logout failed:", error.code, error.message);
      showStatus('Logout failed. See console for details.', true);
    }
  }

  // --- VIEW SPECIFIC LOGIC ---

  async function setupHome() {
    if (currentUserId) {
        latestProjectId = await getLatestProjectId(currentUserId);
        updateNavLinks(latestProjectId);
    }
  }

  function setupConfigurator() {
    const form = document.getElementById('builderForm');
    // Remove any previous listener before adding a new one to prevent duplicate submissions
    form.removeEventListener('submit', handleSubmit); 
    form.addEventListener('submit', handleSubmit);
  }
  
  /**
   * Handles form submission: saves project data and updates user's latest project ID.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    
    const projectType = document.getElementById('projectType').value.trim();
    const woodType = document.getElementById('woodType').value.trim();
    const screwLength = document.getElementById('screwLength').value.trim();
    const height = document.getElementById('height').value.trim();
    const width = document.getElementById('width').value.trim();
    const depth = document.getElementById('depth').value.trim();

    if(!projectType || !woodType || !screwLength || !height || !width || !depth) {
        showStatus('Please fill out all required fields.', true);
        return;
    }

    if (!currentUserId) {
        showStatus('Authentication not ready. Please try again.', true);
        return;
    }

    const submitButton = e.target.querySelector('.btn-primary');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    showStatus('Saving project...', false);

    const projectData = {
        projectType,
        woodType,
        screwLength: parseFloat(screwLength),
        height: parseFloat(height),
        width: parseFloat(width),
        depth: parseFloat(depth),
        userId: currentUserId,
        createdAt: new Date().toISOString()
    };

    try {
        // 1. Save the new project document to the user's private space
        const projectColRef = collection(db, 'artifacts', appId, 'users', currentUserId, 'projects');
        const newProjectRef = await addDoc(projectColRef, projectData);
        const newProjectId = newProjectRef.id;
        latestProjectId = newProjectId; // Update global state

        // 2. Update the user's latest project ID in the config document
        const configDocRef = doc(db, 'artifacts', appId, 'users', currentUserId, 'config', 'latest');
        await setDoc(configDocRef, { latestProjectId: newProjectId, updatedAt: new Date().toISOString() }, { merge: true });

        showStatus('Project saved successfully! Generating materials list...', false);
        
        // 3. Proceed to the materials view with the new project ID
        navigateTo('materials', newProjectId);

    } catch (error) {
        console.error("Error saving project:", error);
        showStatus('Failed to save project. Check console.', true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Project & Get Materials';
    }
  }

  /**
   * Sets up the materials view by fetching project details and calling the LLM.
   */
  async function setupMaterials(projectId) {
    document.getElementById('materialsLoading').classList.remove('hidden');
    document.getElementById('materialsOutput').classList.add('hidden');
    document.getElementById('materialsProjectTitle').textContent = `Loading Project: ${projectId}...`;
    
    // Attach button listener
    document.getElementById('materialsToInstructionsBtn').onclick = (e) => { 
      e.preventDefault(); 
      navigateTo('instructions', projectId); 
      return false; 
    };

    try {
      const projectDocRef = doc(db, 'artifacts', appId, 'users', currentUserId, 'projects', projectId);
      const projectSnap = await getDoc(projectDocRef);

      if (!projectSnap.exists()) {
        showStatus('Project not found.', true);
        navigateTo('home');
        return;
      }

      const data = projectSnap.data();
      
      document.getElementById('materialsProjectTitle').textContent = 
        `Project: ${data.projectType.toUpperCase()} (${data.width}x${data.height}x${data.depth} in)`;
      
      // --- LLM CALL to Generate Materials ---
      const userQuery = `Generate a detailed materials cut list and a short list of required tools for a ${data.projectType} that is ${data.width} inches wide, ${data.height} inches high, and ${data.depth} inches deep, using ${data.woodType} wood and ${data.screwLength} inch screws. Provide the output as a JSON object with two fields: 'materials' (an array of strings) and 'tools' (an array of strings).`;
      
      const payload = {
          contents: [{ parts: [{ text: userQuery }] }],
          generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: "OBJECT",
                  properties: {
                      "materials": { 
                          "type": "ARRAY",
                          "description": "Detailed cut list and hardware.",
                          "items": { "type": "STRING" } 
                      },
                      "tools": { 
                          "type": "ARRAY",
                          "description": "Essential tools required.",
                          "items": { "type": "STRING" } 
                      }
                  },
                  "propertyOrdering": ["materials", "tools"]
              }
          }
      };

      const result = await callGeminiApi(payload);
      const { materials, tools } = result;

      // Display Results
      const materialsUl = document.getElementById('materialsUl');
      materialsUl.innerHTML = materials.map(item => `<li>${item}</li>`).join('');
      
      const toolsUl = document.getElementById('toolsUl');
      toolsUl.innerHTML = tools.map(item => `<li>${item}</li>`).join('');

      document.getElementById('materialsLoading').classList.add('hidden');
      document.getElementById('materialsOutput').classList.remove('hidden');

    } catch (error) {
      console.error("Error setting up materials:", error);
      showStatus('Failed to generate materials list. Check console.', true);
      document.getElementById('materialsLoading').classList.add('hidden');
    }
  }

  /**
   * Sets up the instructions view by fetching project details and calling the LLM.
   */
  async function setupInstructions(projectId) {
    document.getElementById('instructionsLoading').classList.remove('hidden');
    document.getElementById('instructionsResults').classList.add('hidden');
    document.getElementById('instructionsProjectTitle').textContent = `Loading Project: ${projectId}...`;

    // Attach button listener
    document.getElementById('instructionsToHomeBtn').onclick = (e) => { 
      e.preventDefault(); 
      navigateTo('home'); 
      return false; 
    };

    try {
      const projectDocRef = doc(db, 'artifacts', appId, 'users', currentUserId, 'projects', projectId);
      const projectSnap = await getDoc(projectDocRef);

      if (!projectSnap.exists()) {
        showStatus('Project not found.', true);
        navigateTo('home');
        return;
      }

      const data = projectSnap.data();
      
      document.getElementById('instructionsProjectTitle').textContent = 
        `Instructions: ${data.projectType.toUpperCase()} Build`;
      
      // --- LLM CALL to Generate Instructions ---
      const userQuery = `Generate detailed, step-by-step woodworking instructions for building a ${data.projectType} that is ${data.width} inches wide, ${data.height} inches high, and ${data.depth} inches deep, using ${data.woodType} wood and ${data.screwLength} inch screws. Focus on clear, safe construction steps. Provide the output as a JSON object with one field: 'steps' (an array of strings).`;
      
      const payload = {
          contents: [{ parts: [{ text: userQuery }] }],
          generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: "OBJECT",
                  properties: {
                      "steps": { 
                          "type": "ARRAY",
                          "description": "Detailed construction steps.",
                          "items": { "type": "STRING" } 
                      }
                  },
                  "propertyOrdering": ["steps"]
              }
          }
      };

      const result = await callGeminiApi(payload);
      const { steps } = result;

      // Display Results
      const guideSteps = document.getElementById('guideSteps');
      guideSteps.innerHTML = steps.map(step => `<li>${step}</li>`).join('');

      document.getElementById('instructionsLoading').classList.add('hidden');
      document.getElementById('instructionsResults').classList.remove('hidden');

    } catch (error) {
      console.error("Error setting up instructions:", error);
      showStatus('Failed to generate instructions. Check console.', true);
      document.getElementById('instructionsLoading').classList.add('hidden');
    }
  }

  /**
   * Utility function for robust API calls with exponential backoff.
   */
  async function callGeminiApi(payload) {
    const model = "gemini-2.5-flash-preview-09-2025";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const headers = { 'Content-Type': 'application/json' };

    for (let i = 0; i < 3; i++) { // Max 3 retries
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonText) {
            throw new Error("Received empty content from API.");
        }
        
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            // Handle malformed JSON response from the model
            throw new Error(`API returned invalid JSON: ${jsonText}`);
        }

      } catch (error) {
        if (i === 2) {
          console.error("Gemini API call failed after 3 attempts.", error);
          throw new Error("Failed to communicate with the AI builder service.");
        }
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }


  // --- INITIALIZATION ---
  function initializeFirebase() {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      // Set up Auth State Listener
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          currentUserId = user.uid;
          loginBtn.textContent = 'Logout';
          loginBtn.onclick = handleLogout;
          // Now that user is authenticated, check for latest project and set up home view
          await navigateTo('home'); 
        } else {
          currentUserId = null;
          latestProjectId = null;
          loginBtn.textContent = 'Login';
          loginBtn.onclick = handleLogin;
          // Default to home, which will show links as inactive
          navigateTo('home');
        }
      });

      // Initial sign-in attempt
      handleLogin();

    } catch (error) {
      console.error("Firebase Initialization Error:", error);
      showStatus('Failed to initialize Firebase services.', true);
    }
  }

  // Start the application when the window loads
  window.onload = initializeFirebase;
