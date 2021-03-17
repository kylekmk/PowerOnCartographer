# PowerOn Cartographer

----

## What is PowerOn Cartographer?

----

PowerOn Cartographer maps dependencies and dependents of specfiles within Episys using D3.js to show the tree. This makes it possible to see depth of calls made within specfiles and see what the source of problems may be.

![alt text](https://github.com/kylekmk/PowerOnCartographer/blob/master/mapping.GIF?raw=true)

## Change View

----

- Click the Dependency/Dependent Mode button to change the view

### Dependency Mode
- All of the root's descendants are included or are subroutines of the root
- In the file this would be indicated by an **#INCLUDE** or **EXECUTE**

### Dependent Mode
- All of the root's descendants are dependent upon the root
- Each branch of the tree shows the **path** to the dependency
- The child of each node is the immediate dependent of the parent


## Navigation

----

### Dropdown
- Click the specfiles dropdown to choose which file you would like to be the root for the current mode

### Search Bar
- The search feature simply fills the dropdown with results that match the search
- Press enter to select the first choice displayed in the dropdown
- The search bar **only** show results from the current **dependency mode**

### Quick Select
- *Click* a node to select and press *enter* to quickly make that node the root

### Display Branch
- *Double Click* a node to zoom in and show only that branch and its descendants

### Back Button
- Click the back button to quickly go back to the last displayed root
- Root history clears when using search bar, toggle mode, or the dropdown

### Open Legend ☰
- Click to see the meaning of the node colors