using System;
using System.Text;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Net;

namespace PowerOnCartographer
{

    class Scrambler
    {

        Dictionary<string, string> nameDictionary = new Dictionary<string, string>();

        public Scrambler(PowerOnCrawler crawler)
        {
            List<PowerOnFile> roots = crawler.RootFiles;
            List<PowerOnFile> depRoots = crawler.DependentRootFiles;
            foreach (PowerOnFile root in roots)
            {
                scramble(root);
            }

            foreach (PowerOnFile root in depRoots)
            {
                scramble(root);
            }

        }

        private void scramble(PowerOnFile pfile)
        {
            if (nameDictionary.ContainsKey(pfile.name))
            {
                pfile.name = nameDictionary[pfile.name];
            }
            else
            {
                string temp = nameScramble(pfile.name);
                nameDictionary.Add(pfile.name, temp);
                pfile.name = temp;
            }

            if (pfile.parentName != null)
            {
                if (nameDictionary.ContainsKey(pfile.parentName))
                {
                    pfile.parentName = nameDictionary[pfile.parentName];
                }
                else
                {
                    string temp = nameScramble(pfile.parentName);
                    nameDictionary.Add(pfile.parentName, temp);
                    pfile.parentName = temp;
                }
            }

            List<PowerOnFile> children = pfile.children;
            foreach (PowerOnFile child in children)
            {
                scramble(child);
            }
        }

        private string nameScramble(string name)
        {
            if (name != null)
            {
                Random rnd = new Random();
                StringBuilder result = new StringBuilder(name);
                for (int i = 0; i < name.Length; i++)
                {
                    int newIndex = rnd.Next(name.Length);
                    result[newIndex] = name[i];
                }
                return result.ToString();
            }
            return name;
        }

    }



}