function showSection(sectionId) {
    // Hide all sections
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }
    
    // Show the selected section
    var selectedSection = document.getElementById(sectionId);
    selectedSection.classList.add('active');
}

// Show education section by default when page loads
window.onload = function() {
    showSection('education');
};
