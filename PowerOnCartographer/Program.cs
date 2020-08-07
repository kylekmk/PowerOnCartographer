using System;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Net;

namespace PowerOnCartographer
{
    class Program
    {
        static void Main(string[] args)
        {
            Utility utility = new Utility();
            PowerOnCrawler crawler = new PowerOnCrawler();
            crawler.dependentDictionary = new Dictionary<string, PowerOnFile>();
            crawler.pofDictionary = new Dictionary<string, PowerOnFile>();
            crawler.Init();
            crawler.Totals();
         


            // Processes tree
            // Creates Dependent Tree and sorts branches
            foreach (PowerOnFile root in crawler.RootFiles)
            {
                root.IsASubroutine = false;
                crawler.path = new Stack<PowerOnFile>();
                crawler.ProcessTrees(root);
                crawler.descendents(root);
                crawler.SortByChild(root.children, root, new childSorter());
            }
            crawler.AddDescendents();
            crawler.BuildDependentTree();
            // Sorts branches
            foreach (PowerOnFile root in crawler.DependentRootFiles)
            {
                crawler.mergePaths(root.children, root);
                crawler.descendents(root);
                crawler.setBranchCount(root);
                crawler.SortByChild(root.children, root, new childSorter());
            }

            crawler.RootFiles.Sort(new rootSorter());
            crawler.DependentRootFiles.Sort(new rootSorter());
            Scrambler scram = new Scrambler(crawler);
            HtmlRender renderer = new HtmlRender(crawler);
            renderer.RenderChartJs("Test1.html");
            crawler.Print();
        }
    }
    public class PowerOnCrawler
    {
        public Stack<PowerOnFile> path;
        public Dictionary <string, PowerOnFile> dependentDictionary;
        public Dictionary<string, PowerOnFile> pofDictionary;
        public List<PowerOnFile> RootFiles { get; set; }
        public List<PowerOnFile> DependentRootFiles { get; set; }

        public string RepGenBucketPath = @"C:\UFCU\RepGenDump778";


        public List<string> power_on_all_file_names = new List<string>(File.ReadAllLines(@"C:\UFCU\PowerOnCartographer\PowerOnCartographer\Assets\PowerOnFileMasterList.txt"));
        public List<string> drop_down_file_lines =
            new List<string>(File.ReadAllLines(@"C:\UFCU\PowerOnCartographer\PowerOnCartographer\Assets\PowerOnFilesFromDropDown.txt"))
            .FindAll(x => !String.IsNullOrEmpty(x) && !x.Contains("===") && !(x.Contains("[") && x.Contains("]"))).ToList();

        // Demand Use Files
        public Regex file_name_regex = new Regex(@"Specfile\=([^~]+)~");
        public Regex include_regex = new Regex(@"#INCLUDE ""([^""]+)""");
        public Regex subroutine_regex = new Regex(@"EXECUTE\(""([^""]+)""");

     



        public void Init()
        {

            //Regex subroutines_regex = new Regex(@"Specfile\=([^~]+)~");
            RootFiles = new List<PowerOnFile>();
            foreach (var root_file_name_raw in drop_down_file_lines.Distinct())
            {
                Match root_file_name_match = file_name_regex.Match(root_file_name_raw);
                if (root_file_name_match.Success && root_file_name_match.Groups.Count > 1)
                {
                    PowerOnFile pof = Crawl(root_file_name_match.Groups[1].Value);
                    if (pof != null)
                    {
                        pof.IsFirstParent = true;
                        RootFiles.Add(pof);
                    }
                }
            }

        }

        public PowerOnFile Crawl(string file_name, int depth = 0, bool isSubroutine = true)
        {
            if (depth > 6) return null;

            string file_content = File.ReadAllText(RepGenBucketPath + "\\" + file_name);

            PowerOnFile pof = new PowerOnFile()
            {
                name = file_name,
                Includes = new List<PowerOnFile>(),
                Subroutines = new List<PowerOnFile>(),
                Depth = depth,
                IsASubroutine = isSubroutine
            };

            MatchCollection include_matches = include_regex.Matches(file_content);
            foreach (Match include_match in include_matches)
            {
                string include_name = include_match.Groups.Count > 1 ? include_match.Groups[1].Value : "";
                PowerOnFile include_pof = Crawl(include_name, depth, false);
                if (include_pof != null) { 
                    include_pof.parentName = file_name;
                    pof.Includes.Add(include_pof); 
                }
            }

            MatchCollection subroutine_matches = subroutine_regex.Matches(file_content);
            foreach (Match subroutine_match in subroutine_matches)
            {
                string subroutine_name = subroutine_match.Groups.Count > 1 ? subroutine_match.Groups[1].Value : "";
                PowerOnFile subroutine_pof = Crawl(subroutine_name, depth + 1, true);
                if (subroutine_pof != null)
                {
                    subroutine_pof.parentName = file_name;
                    pof.Subroutines.Add(subroutine_pof);
                }
            }
            pof.children = new List<PowerOnFile>();
            pof.children.AddRange(pof.Includes);
            pof.children.AddRange(pof.Subroutines);

            return pof;
        }
        public void Print()
        {

            foreach (var item in RootFiles)
            {
                Console.WriteLine("----------");
                PrintFile(item);
            }
        }
        private void PrintFile(PowerOnFile file = null, int depth = 0, bool isSubroutine = false)
        {
            if (file.IsASubroutine)
            {
                for (int i = 0; i < depth; i++) { Console.Write(isSubroutine ? "@" : "#"); }
                Console.WriteLine(file.name);
            }

            foreach (var include in file.Includes) { PrintFile(include, depth, false); }
            foreach (var include in file.Subroutines) { PrintFile(include, depth + 1, true); }
        }
        public void Totals()
        {
            foreach (var item in RootFiles)
            {
                Console.Write("-");
                int check = DepthPerFile(item);
                item.RootDepth = check;

            }
            RootFiles.Sort((x, y) => y.RootDepth.CompareTo(x.RootDepth));

            foreach (var item in RootFiles)
            {
                Console.WriteLine(item.name + ": " + item.RootDepth);

            }
            Print();

        }
        private int DepthPerFile(PowerOnFile file = null)
        {
            file.Content = "";
            int result_depth = file.Depth;
            foreach (var include in file.Includes)
            {
                result_depth = Math.Max(result_depth, DepthPerFile(include));
            }
            foreach (var subroutine in file.Subroutines)
            {
                result_depth = Math.Max(result_depth, DepthPerFile(subroutine));
            }
            return result_depth;
        }

        // Eliminates recurisive calls from the map
        internal void ProcessTrees(PowerOnFile pfile)
        {
            path.Push(pfile);
            int len = pfile.children.Count;
            // Move through children of pfile
            for (int i = 0; i < len; i++)
            {
                PowerOnFile child = pfile.children[i];
                if (!pofDictionary.ContainsKey(child.name)) { pofDictionary[child.name] = child; }


                // found a recursive call... remove children and subroutines
                if (path.Any(pathMember => pathMember.name == child.name))
                {
                    child.children = new List<PowerOnFile>();
                    child.Subroutines = new List<PowerOnFile>();
                    child.Includes = new List<PowerOnFile>();
                    child.IsRecursive = true;
                } // keep searching for recursive calls
                else if (child.children.Count != 0)
                {
                    ProcessTrees(child);
                }
                AddToDependentTree(child, path);
            }
            path.Pop();

        }

        internal void AddToDependentTree(PowerOnFile root, Stack<PowerOnFile> path)
        {
            var path_copy = DeepCopy<Stack<PowerOnFile>>(path);
            var root_copy = DeepCopy<PowerOnFile>(root);
            root_copy.clear();
            if (!dependentDictionary.Keys.Contains(root_copy.name)) dependentDictionary.Add(root_copy.name, root_copy);

            dependentDictionary[root_copy.name] = ConvertStack(dependentDictionary[root_copy.name], path_copy);
        }
        internal PowerOnFile ConvertStack(PowerOnFile root, Stack<PowerOnFile> path)
        {
            root.DependencyMode = false;
            var tempPointer = root;
            while (path.Count > 0)
            {
                var ancestor = path.Pop();
                ancestor.clear();
                ancestor.DependencyMode = false;
                tempPointer.children.Add(ancestor);
                tempPointer = ancestor;
            }
            return root;
        }

        internal void BuildDependentTree()
        {
            DependentRootFiles = new List<PowerOnFile>();
            foreach (var kvp in dependentDictionary)
            {
                kvp.Value.parentName = null;
                DependentRootFiles.Add(kvp.Value);
            }
        }

        public static T DeepCopy<T>(object objectToCopy)
        {
            using (MemoryStream memoryStream = new MemoryStream())
            {
                System.Runtime.Serialization.Formatters.Binary.BinaryFormatter binaryFormatter
                    = new System.Runtime.Serialization.Formatters.Binary.BinaryFormatter();
                binaryFormatter.Serialize(memoryStream, objectToCopy);
                memoryStream.Seek(0, SeekOrigin.Begin);
                return (T)binaryFormatter.Deserialize(memoryStream);
            }
        }

        internal void SortByChild(List<PowerOnFile> children, PowerOnFile parent, childSorter cs)
        {
            children.Sort(cs);
            foreach (PowerOnFile child in children)
            {
                child.parentName = parent.name;
                SortByChild(child.children, child, cs);
            }
        }

        public int descendents(PowerOnFile pof)
        {
            int count = pof.children.Count;

            foreach (PowerOnFile child in pof.children)
            {
                count += descendents(child);
            }
            pof.descendentCount = count;
            return count;
        }

        internal void mergePaths(List<PowerOnFile> children, PowerOnFile root)
        {
            Dictionary<string, PowerOnFile> mergeMap = new Dictionary<string, PowerOnFile>();
            foreach (PowerOnFile pof in children)
            {
                if (mergeMap.ContainsKey(pof.name))
                {
                    mergeMap[pof.name] = mergePOF(mergeMap[pof.name], pof);
                }
                else
                {
                    mergeMap.Add(pof.name, pof);
                }
            }

            root.children = new List<PowerOnFile>();
            foreach (var kvp in mergeMap)
            {
                PowerOnFile temp_pof = kvp.Value;
                mergePaths(temp_pof.children, temp_pof);
                root.children.Add(temp_pof);
            }

        }

        private PowerOnFile mergePOF(PowerOnFile main_pof, PowerOnFile pof)
        {
            main_pof.children.AddRange(pof.children);
            return main_pof;
        }

        internal void setBranchCount(PowerOnFile root)
        {
            foreach (PowerOnFile child in root.children)
            {
                child.nodesInBranch = child.descendentCount;
                branchCountHelp(child);
            }
        }

        private void branchCountHelp(PowerOnFile parent)
        {
            foreach (PowerOnFile child in parent.children)
            {
                child.nodesInBranch = parent.nodesInBranch;
                branchCountHelp(child);
            }
        }

        internal void AddDescendents()
        {
            foreach(var kvp in pofDictionary)
            {
                RootFiles.Add(kvp.Value);
            }
        }
    }
    [Serializable]
    public class PowerOnFile
    {
        public PowerOnFile()
        {
            //If DependencyMode is false means DependentMode
            DependencyMode = true;
        }
        public string name { get; set; }
        public string parentName { get; set; }
        public string Content { get; set; }
        public string Alias { get; set; }
        public string Category { get; set; }
        public int Depth { get; set; }
        public int RootDepth { get; set; }
        public Boolean IsASubroutine { get; set; }
        public Boolean IsRecursive { get; set; }
        public Boolean DependencyMode { get; set; }
        public Boolean IsFirstParent { get; set; }
        public Boolean IsJobFile { get; set; }
        public int descendentCount { get; set; }
        public int nodesInBranch { get; set; }
        public List<PowerOnFile> Includes { get; set; }
        public List<PowerOnFile> Subroutines { get; set; }
        public List<PowerOnFile> children { get; set; }

        public void clear()
        {
            Includes = new List<PowerOnFile>();
            Subroutines = new List<PowerOnFile>();
            children = new List<PowerOnFile>();

        }

    }

    class childSorter : IComparer<PowerOnFile>
    {
        public int Compare(PowerOnFile x, PowerOnFile y)
        {
            int result = x.descendentCount.CompareTo(y.descendentCount);
            if (result == 0)
            {
                result = x.name.CompareTo(y.name);
            }

            return result;
        }

    }
    class rootSorter : IComparer<PowerOnFile>
    {
        public int Compare(PowerOnFile x, PowerOnFile y)
        {
            if (x.IsFirstParent == y.IsFirstParent)
            {
                return x.name.CompareTo(y.name);
            }
            else if (!x.IsFirstParent && y.IsFirstParent)
            {
                return 1;
            }
            else
            {
                return -1;
            }

        }

    }
}