// JavaScript to handle mouseover and mouseout events
var activeMethodPill = null;
var activeScenePill = null;
var activeModePill = null;
var activeVidID = 0;
var select = false;

var editor = null;

$(document).ready(function () {
  editor = CodeMirror.fromTextArea(document.getElementById("bibtex"), {
    lineNumbers: false,
    lineWrapping: true,
    readOnly: true,
  });
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });

  editor.removeTag = CodeMirror.removeTag;
  var cm = $(".CodeMirror");
  cm.editor = editor;
  editor.save();
  editor.setOption("mode", "htmlmixed");

  // resizeAndPlay($('#sparsity')[0]);
});

function copyBibtex() {
  if (editor) {
    navigator.clipboard.writeText(editor.getValue());
  }
}

// function selectCompVideo(methodPill, scenePill, modePill) {
//     // Your existing logic for video selection
//     // var video = document.getElementById("compVideo");
//     select = true;

//     if (activeMethodPill) {
//         activeMethodPill.classList.remove("active");
//     }
//     if (activeScenePill) {
//         activeScenePill.classList.remove("active");
//     }
//     if (modePill) {
//         activeModePill.classList.remove("active");
//         modePill.classList.add("active");
//         activeModePill = modePill;
//     }
//     activeMethodPill = methodPill;
//     activeScenePill = scenePill;
//     methodPill.classList.add("active");
//     scenePill.classList.add("active");
//     method = methodPill.getAttribute("data-value");
//     pill = scenePill.getAttribute("data-value");
//     mode = activeModePill.getAttribute("data-value");

//     // swap video to avoid flickering
//     activeVidID = 1 - activeVidID;
//     var video_active = document.getElementById("compVideo" + activeVidID);
//     video_active.src = "videos/comparison/" + pill + "_" + method + "_vs_ours_" + mode + ".mp4";
//     video_active.load();
// }

function initTableOfContents() {
  const sections = Array.from(document.querySelectorAll("h2"));
  const tocList = document.getElementById("toc-list");
  const tocSidebar = document.getElementById("toc-sidebar");

  // Create TOC items
  const tocItems = sections.map((section) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = section.textContent;
    link.href = `#${section.id}`;
    link.style.cssText = `
      color: #333; 
      text-decoration: none; 
      font-size: 0.9em; 
      transition: all 0.3s;
      display: block;
      text-align: left;
      padding: 4px 0;
    `;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(section.id).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    li.appendChild(link);
    return li;
  });

  // Populate TOC
  tocItems.forEach((item) => tocList.appendChild(item));

  // Create global variables to track state
  window.intersectingSections = window.intersectingSections || new Map();
  window.lastScrollY = window.scrollY;
  window.scrollingDown = true; // Default direction
  window.lastIntersectingIds = new Set(); // Track which sections were previously intersecting
  
  // Track scroll direction with debouncing for more accuracy
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      window.scrollingDown = window.scrollY > window.lastScrollY;
      window.lastScrollY = window.scrollY;
    }, 50);
  });
  
  const observer = new IntersectionObserver(
    (entries) => {
      // Identify newly intersecting sections
      const newlyIntersecting = new Set();
      const currentlyIntersecting = new Set();
      
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("id");
        
        if (entry.isIntersecting) {
          // Add to our map with the top position as the value
          window.intersectingSections.set(id, entry.boundingClientRect.top);
          currentlyIntersecting.add(id);
          
          // Check if this is newly intersecting
          if (!window.lastIntersectingIds.has(id)) {
            newlyIntersecting.add(id);
          }
        } else {
          // Remove from our map if no longer intersecting
          window.intersectingSections.delete(id);
        }
      });
      
      // Update our tracking of which sections were intersecting
      window.lastIntersectingIds = new Set([...window.intersectingSections.keys()]);
      
      // Reset all links first
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.style.color = "#333";
        link.style.fontWeight = "400";
      });
      
      // Sort intersecting sections by their top position
      const sortedSections = Array.from(window.intersectingSections.entries())
        .sort((a, b) => a[1] - b[1]);
      
      if (sortedSections.length >= 2) {
        // We have at least two sections visible
        let primaryId, secondaryId;
        
        if (newlyIntersecting.size > 0) {
          // If we have newly intersecting sections, prioritize those
          const newIds = Array.from(newlyIntersecting);
          
          if (window.scrollingDown) {
            // When scrolling down, the new section is at the bottom
            // Find the lowest (largest Y value) newly intersecting section
            const newSections = sortedSections.filter(s => newlyIntersecting.has(s[0]));
            if (newSections.length > 0) {
              secondaryId = newSections[newSections.length - 1][0]; // Bottom-most new section
              
              // The primary is the top-most section that's not new
              const oldSections = sortedSections.filter(s => !newlyIntersecting.has(s[0]));
              primaryId = oldSections.length > 0 ? oldSections[0][0] : sortedSections[0][0];
            }
          } else {
            // When scrolling up, the new section is at the top
            // Find the highest (smallest Y value) newly intersecting section
            const newSections = sortedSections.filter(s => newlyIntersecting.has(s[0]));
            if (newSections.length > 0) {
              secondaryId = newSections[0][0]; // Top-most new section
              
              // The primary is the bottom-most section that's not new
              const oldSections = sortedSections.filter(s => !newlyIntersecting.has(s[0]));
              primaryId = oldSections.length > 0 ? 
                oldSections[oldSections.length - 1][0] : 
                sortedSections[sortedSections.length - 1][0];
            }
          }
        }
        
        // If we couldn't determine based on newly intersecting sections, fall back to position
        if (!primaryId || !secondaryId) {
          if (window.scrollingDown) {
            primaryId = sortedSections[0][0]; // Top section
            secondaryId = sortedSections[sortedSections.length - 1][0]; // Bottom section
          } else {
            secondaryId = sortedSections[0][0]; // Top section
            primaryId = sortedSections[sortedSections.length - 1][0]; // Bottom section
          }
        }
        
        // Apply styles
        const primaryLink = document.querySelector(`a[href="#${primaryId}"]`);
        const secondaryLink = document.querySelector(`a[href="#${secondaryId}"]`);
        
        if (primaryLink) {
          primaryLink.style.color = "#007bff";
          primaryLink.style.fontWeight = "600";
        }
        if (secondaryLink) {
          secondaryLink.style.color = "#7db9e8";
          secondaryLink.style.fontWeight = "600";
        }
      } else if (sortedSections.length === 1) {
        // Only one section visible, make it blue
        const id = sortedSections[0][0];
        const link = document.querySelector(`a[href="#${id}"]`);
        if (link) {
          link.style.color = "#007bff";
          link.style.fontWeight = "600";
        }
      }
    },
    { threshold: 0.2 }
  );

  sections.forEach((section) => observer.observe(section));
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", function () {
  initTableOfContents();
});
