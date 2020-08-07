


var specfiles = document.getElementById("specfiles");
var togglebtn = document.getElementById("toggleButton");
var searchBar = document.getElementById("search");
var popup = document.getElementById("myPopup");

var file_tree = dependency_file_tree;
var secondary_tree = dependent_file_tree;
var DependencyMode = true;
var zoomed = false;
var backtrack = [];
var lastClicked;

// initialize area to draw

var margin = { top: 75, right: 120, bottom: 20, left: 140 },
    width = 2500 - margin.right - margin.left,
    height = 1000 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function (d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

root = file_tree[0];
root.x0 = height / 2;
root.y0 = 0;

update(root);
populatePopup(root);

d3.select(self.frameElement).style("height", "1000px");

// Enables arrow keys to be used on dropdown initially
specfiles.focus();

// choose root based on dropdown
function newTree() {
    // choose selected choice
    var index = specfiles.value;
    // clear back button
    backtrack = [];
    lastClicked = undefined;
    root = file_tree[index];
    update(root);
    populatePopup(root);
}

// changes dependency mode
function toggleMode() {
    DependencyMode = !DependencyMode;
    removeSpecfiles(); // clean out old options
    // alternate source of data
    if (DependencyMode) {
        togglebtn.innerHTML = "Dependency Mode";
        file_tree = dependency_file_tree;
        secondary_tree = dependent_file_tree;
    }
    else {
        togglebtn.innerHTML = "Dependent Mode";
        file_tree = dependent_file_tree;
        secondary_tree = dependency_file_tree;
    }
    // add new options
    fillDropdown();
    // choose first in list
    firstChoice();
    specfiles.focus();
    populatePopup(root);
}

// prioritizes direct matches and populates dropdown with substrings
function match() {
    var key = searchBar.value.toUpperCase();
    specfiles.remove(0);
    // refresh dropdown
    if (searchBar.value === "") {
        removeSpecfiles();
        fillDropdown();
    } else {
        // search for direct match
        for (var i = 0; i < file_tree.length; i++) {
            // matched!!
            if (file_tree[i].name.toUpperCase() === key) {
                backtrack = [];
                lastClicked = undefined;
                // give other options
                filterList(key);
                // select direct match
                root = file_tree[i];
                specfiles.value = i;
                update(root);
                populatePopup(root);
                return;
            }
        }
        // show possible matches
        filterList(key);
    }
}

// fills list with options containing the substring 'key'
function filterList(key) {
    // clear out list
    removeSpecfiles();
    // add options for root.name containing the key
    for (var i = 0; i < file_tree.length; i++) {
        if (file_tree[i].name.toUpperCase().includes(key)) {
            var option = document.createElement("option");
            option.value = i;
            option.text = file_tree[i].name;
            specfiles.add(option)
        }
    }

    // no matches found
    if (specfiles.length == 0) {
        var option = document.createElement("option");
        option.value = -1;
        option.text = "No matches for " + key;
        option.disabled = true;
        specfiles.add(option);
        specfiles.selectedIndex = 0;
    }
}

// clears out list of all options
function removeSpecfiles() {
    while (specfiles.length > 0) {
        specfiles.remove(0);
    }
}

// update to first option in dropdown list
// used by "enter" key and toggleMode()
function firstChoice() {
    backtrack = [];
    lastClicked = undefined;
    specfiles.selectedIndex = 0;
    root = file_tree[specfiles.value];
    update(root);
    populatePopup(root);
}

// populates dropdown with all roots from file_tree
// used by empty search bar and toggleMode()
function fillDropdown() {
    // create options for every root
    for (var i = 0; i < file_tree.length; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = file_tree[i].name;
        specfiles.add(option);
    }
}

// Select the node and change color to reflect that
function click(d) {
    var notRoot = DependencyMode ? !d.IsFirstParent : d.IsFirstParent || d.parent != null;
    if (notRoot) {
        lastClicked = d;
        update(d);
    }
    populatePopup(d);
}

// Zoom into node and save path
function dblclick(d) {
    backtrack.push(root);
    root = d;
    update(root);
    populatePopup(root);
}

// pop path to root and show old root
function zoomOut() {
    root = backtrack.pop();
    // change mode if needed
    if (root.DependencyMode != DependencyMode) {
        var temp_tree = secondary_tree;
        secondary_tree = file_tree;
        file_tree = temp_tree;
        DependencyMode = !DependencyMode;
        togglebtn.innerHTML = DependencyMode ? "Dependency Mode" : "Dependent Mode";
        removeSpecfiles();
        fillDropdown();
    }
    update(root);
    populatePopup(root);
}

function populatePopup(d) {
    // document.getElementById("myPopup").style.paddingTop = "60px";
    popup.innerText = "";
    var mode = document.createElement("h1");
    mode.innerHTML = DependencyMode ? "DEPENDENCY MODE" : "DEPENDENT MODE";
    var name = document.createElement("a");
    name.innerHTML = "Node: " + d.name;
    var parent = document.createElement("a");
    parent.innerHTML = d.parentName != null ? "Parent: " + d.parentName : "Parent: None";
    var depth = document.createElement("a");
    depth.innerHTML = "Depth: " + d.depth;

    popup.append(mode);
    popup.append(name);
    popup.append(parent);
    if (d.parentName != null) {
        var sub = document.createElement("a");
        sub.innerHTML = d.IsASubroutine === true ? "Subroutine of Parent: True" : "Subroutine of Parent: False";
        var incl = document.createElement("a");
        incl.innerHTML = d.IsASubroutine === false ? "Included by Parent: True" : "Included by Parent: False";
        popup.append(sub);
        popup.append(incl);
    }
    popup.append(depth);

}

dragElement(document.getElementById("arrow"));

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0;

    document.getElementById("arrow").onmousedown = dragMouseDown;


    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos2 = e.clientX;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos2 - e.clientX;
        pos2 = e.clientX;
        // set the element's new position:
        var left = elmnt.offsetLeft - pos1;
        if (0 <= left && left <= 500) {
            elmnt.style.left = left + "px";
            popup.style.left = (left - 500) + "px";
        }
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// side bar open
function openNav() {
    document.getElementById("openbtn").color = "transparent";
    document.getElementById("mySidebar").style.paddingTop = "60px";
    document.getElementById("mySidebar").style.height = "250px";
}

// side bar closed
function closeNav() {
    document.getElementById("openbtn").color = "white";
    document.getElementById("mySidebar").style.paddingTop = "0";
    document.getElementById("mySidebar").style.height = "0";
}


// pick the first choice in the drop down when enter is pressed while searching
function handle(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        firstChoice();
    }
}

// When enter is pressed update the root to the last clicked node
document.addEventListener("keypress", toggleSearch);
function toggleSearch(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        searchFromLastClick();
    }
}


// make the node that was last clicked on the root
// and switch to the mode it belongs to
function searchFromLastClick() {
    var searchFocused = $("#search").is(":focus");
    // if a node is selected and the search bar isn't active
    if (lastClicked != undefined && !searchFocused) {
        // which tree is looked into
        var temp_tree = lastClicked.IsFirstParent ? dependency_file_tree : dependent_file_tree;
        // find node as a root
        for (var i = 0; i < temp_tree.length; i++) {
            // matched
            if (temp_tree[i].name.toUpperCase() === lastClicked.name.toUpperCase()) {
                // mode needs to be switched
                if (temp_tree != file_tree) {
                    DependencyMode = !DependencyMode;
                    togglebtn.innerHTML = DependencyMode ? "Dependency Mode" : "Dependent Mode";
                    secondary_tree = file_tree;
                    file_tree = temp_tree;
                }
                // full dropdown with node selected
                removeSpecfiles();
                fillDropdown();
                specfiles.value = i;
                backtrack.push(root);
                lastClicked = undefined;
                root = temp_tree[i];
                update(root);
            }
        }
    }
}

function update(source) {


    // show back button only when it has contents
    if (backtrack.length === 0) {
        document.getElementById("backbtn").style.display = "none";
    } else {
        document.getElementById("backbtn").style.display = "inline";
    }

    zoomed = DependencyMode && !root.IsFirstParent || !DependencyMode && (root.parent != null || root.IsFirstParent);



    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    if (DependencyMode || zoomed) {
        nodes.forEach(function (d) { d.y = d.depth * 300 });
    } else {

        var highestNode = root;
        var lowestNode = root;
        var left = 75;
        var rightBranchCount = 0;

        nodes.forEach(function (d) {
            if (d != root && (d.children != undefined || d.parent != root)) {
                if (d.x < highestNode.x) {
                    highestNode = d
                }
                if (d.x > lowestNode.x) {
                    lowestNode = d;
                }
                rightBranchCount++;

            }
        });

        var differenceToTop = highestNode.x;

        nodes.forEach(function (d) {
            if (d != root && (d.children != undefined || d.parent != root)) {
                var newX = (d.x - differenceToTop) * (height / lowestNode.x);
                if (d === lowestNode) { console.log(d); }
                /*
                var newX = (d.x - differenceToTop) * (1 + d.nodesInBranch / (rightBranchCount * 2)) + 75;
                if (newX > height) {
                    console.log(d);
                    console.log(newX);
                }*/
                d.x = newX;
                d.y = d.depth * 300;
            } else { // single node, root is its parent, in Dependent Mode
                d.y = 100;
                d.x = left;
                left += 20;
            }
        });
        root.y = 200;
        root.x = 100;
    }

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function (d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click)
        .on("dblclick", dblclick);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function (d) {

            if (d === lastClicked) {
                return "eb4034";
            } else if (d.IsJobFile == true) {
                return "#be45d9"
            } else if (d.IsFirstParent == true) {
                return "#33b572";
            } else if (d.IsASubroutine) {
                return "#f47a20";
            } else if (d.IsRecursive == true) {
                return "#f5d142";
            }

            return "#fff";
        })
        .on("click", click);

    var isRoot;

    nodeEnter.append("text")
        .attr("x", function (d) {
            isRoot = DependencyMode ? d.IsFirstParent : !d.IsFirstParent && d.parentName === null;
            if (d.parentName === root.name && !DependencyMode && d.children === undefined) { return -13; }
            else if (!isRoot && !DependencyMode) { return 20; }
            return isRoot ? 0 : 13;
        })
        .attr("y", function (d) {
            isRoot = DependencyMode ? d.IsFirstParent : !d.IsFirstParent && d.parentName === null;
            return isRoot ? -20 : 0;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function (d) {
            if (d.parentName === root.name && !DependencyMode && d.children === undefined) { return "end"; }
            isRoot = DependencyMode ? d.IsFirstParent : !d.IsFirstParent && d.parentName === null;
            return isRoot ? "middle" : "start";
        })
        .text(function (d) {
            return d.name;
        })
        .style("fill-opacity", 1e-6);


    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", function (d) { if (lastClicked === d) { return DependencyMode ? 7 : 2.5; } if (d === root) { return 5; } return DependencyMode ? 5 : 1; })
        .style("transition", "all .2s")
        .style("stroke", function (d) {

            if (d === lastClicked) {
                return "eb4034";
            } else if (d.IsJobFile == true) {
                return "#be45d9"
            } else if (d.IsFirstParent == true) {
                return "#33b572";
            } else if (d.IsASubroutine) {
                return "#f47a20";
            } else if (d.IsRecursive == true) {
                return "#f5d142";
            }

            return "#174992";
        })
        .style("fill", function (d) {

            if (d === lastClicked) {
                return "eb4034";
            } else if (d.IsJobFile == true) {
                return "#be45d9"
            } else if (d.IsFirstParent == true) {
                return "#33b572";
            } else if (d.IsASubroutine) {
                return "#f47a20";
            } else if (d.IsRecursive == true) {
                return "#f5d142";
            }

            return "#fff";
        });


    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function (d) { return d.target.id; });

    // arrows away from the root
    if (DependencyMode) {
        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            })
            .attr("marker-end", "url(#end)");

        svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
    }
    else { // arrows into the root
        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            })
            .attr("marker-start", "url(#start)")
            .attr("painted", "first");

        svg.append("svg:defs").selectAll("marker")
            .data(["start"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto-start-reverse")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
    }

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}
