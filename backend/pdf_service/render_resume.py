#!/usr/bin/env python3
import json
import sys
import os
import argparse
from jinja2 import Environment, FileSystemLoader
import subprocess
import tempfile
import shutil

def render_resume_to_pdf(resume_data, output_path, template_name="jakes-resume-template-jinja.tex"):
    """
    Render resume data to PDF using LaTeX template with pdflatex fallback
    """
    try:
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(script_dir, 'templates')
        
        # Set up Jinja2 environment
        env = Environment(
            loader=FileSystemLoader(templates_dir),
            comment_start_string='((*',
            comment_end_string='*))'
        )
        template = env.get_template(template_name)
        
        # Extract data for template
        basics = resume_data.get('basics', {})
        work = resume_data.get('work', [])
        education = resume_data.get('education', [])
        skills = resume_data.get('skills', [])
        projects = resume_data.get('projects', [])
        
        # Prepare template data
        template_data = {
            'name': basics.get('name', 'Your Name'),
            'title': basics.get('professionalTitle', ''),
            'dob': basics.get('dateOfBirth', ''),
            'summary': basics.get('summary', ''),
            'email': basics.get('email', ''),
            'phone': basics.get('phone', ''),
            'linkedin': basics.get('linkedin', ''),
            'github': basics.get('github', ''),
            'location': basics.get('location', {}).get('address', ''),
            'experience': [{
                'company': job.get('company', ''),
                'position': job.get('position', ''),
                'location': job.get('location', ''),
                'date': f"{job.get('startDate', '')} - {job.get('endDate', 'Present')}",
                'highlights': job.get('highlights', [])
            } for job in work],
            'education': [{
                'institution': edu.get('institution', ''),
                'degree': f"{edu.get('studyType', '')} {edu.get('area', '')}".strip(),
                'location': '',
                'date': f"{edu.get('startDate', '')} - {edu.get('endDate', '')}".strip(' -')
            } for edu in education],
            'projects': [{
                'name': proj.get('name', ''),
                'technologies': ', '.join(proj.get('keywords', [])),
                'date': proj.get('startDate', ''),
                'highlights': proj.get('highlights', [])
            } for proj in projects],
            'skills': skills
        }
        
        # Render LaTeX
        latex_content = template.render(**template_data)
        
        # Create temp directory for compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_file_path = os.path.join(temp_dir, 'resume.tex')
            
            # Write LaTeX file
            with open(tex_file_path, 'w', encoding='utf-8') as tex_file:
                tex_file.write(latex_content)
            
            # Define PDF engines
            engines = []
            
            # 1. Tectonic (PATH)
            if shutil.which('tectonic'):
                engines.append(['tectonic', tex_file_path, '-o', temp_dir])
                
            # 2. pdflatex (PATH)
            if shutil.which('pdflatex'):
                engines.append(['pdflatex', '-interaction=nonstopmode', 'resume.tex'])
                
            # 3. pdflatex (Full Path - User AppData)
            user_pdflatex = os.path.expanduser(r'~\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe')
            if os.path.exists(user_pdflatex):
                engines.append([user_pdflatex, '-interaction=nonstopmode', 'resume.tex'])
            
            if not engines:
                raise Exception("No LaTeX engine found (tectonic or pdflatex). Please install MiKTeX or Tectonic.")
            
            # Try engines in order
            success = False
            last_error = ""
            
            for cmd in engines:
                engine_name = os.path.basename(cmd[0])
                print(f"Attempting compilation with {engine_name}...", file=sys.stderr)
                
                try:
                    # Run twice for references if it's pdflatex
                    iterations = 1 # Optimized for speed, set to 2 if references break
                    
                    for i in range(iterations):
                        result = subprocess.run(
                            cmd,
                            capture_output=True,
                            text=True,
                            cwd=temp_dir
                        )
                        
                        if result.returncode != 0:
                            raise Exception(f"{engine_name} failed: {result.stderr}\n{result.stdout}")
                    
                    temp_pdf = os.path.join(temp_dir, 'resume.pdf')
                    if os.path.exists(temp_pdf):
                        shutil.copy(temp_pdf, output_path)
                        print(f"Successfully compiled with {engine_name}", file=sys.stderr)
                        success = True
                        break
                except Exception as e:
                    last_error = str(e)
                    print(f"Failed with {engine_name}: {last_error}", file=sys.stderr)
                    continue
            
            if not success:
                raise Exception(f"All LaTeX engines failed. Last error: {last_error}")
            
            return True
            
    except Exception as e:
        # Print to stderr so Node.js can capture it
        print(f"Render Error: {str(e)}", file=sys.stderr)
        raise Exception(f"Render Error: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume-json', required=True)
    parser.add_argument('--output-pdf', required=True)
    args = parser.parse_args()
    
    try:
        with open(args.resume_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        render_resume_to_pdf(data, args.output_pdf)
        print("Success")
    except Exception as e:
        sys.exit(1)