#!/usr/bin/env python3
import json
import sys
import os
import argparse
from jinja2 import Environment, FileSystemLoader
import subprocess
import tempfile

def render_resume_to_pdf(resume_data, output_path, template_name="jakes-resume-template-jinja.tex"):
    """
    Render resume data to PDF using LaTeX template
    """
    try:
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(script_dir, 'templates')
        
        # Set up Jinja2 environment
        # We change comment delimiters because {# conflicts with LaTeX syntax like {#1
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
            'email': basics.get('email', ''),
            'phone': basics.get('phone', ''),
            'linkedin': basics.get('linkedin', ''),
            'github': basics.get('github', ''),
            'experience': [{
                'company': job.get('company', ''),
                'position': job.get('position', ''),
                'location': job.get('location', ''),
                'date': f"{job.get('startDate', '')} - {job.get('endDate', 'Present')}",
                'items': job.get('highlights', [])
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
                'items': proj.get('highlights', [])
            } for proj in projects],
            'skills': skills
        }
        
        # 5. Render LaTeX
        latex_content = template.render(**template_data)
        
        # 6. Create temp file and compile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tex', delete=False, encoding='utf-8') as tex_file:
            tex_file.write(latex_content)
            tex_file_path = tex_file.name
        
        # Run Tectonic
        # -c ignores cached files, helpful for clean builds
        result = subprocess.run(
            ['tectonic', tex_file_path, '-o', os.path.dirname(output_path)], 
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            # Print stderr for debugging (captured by Node.js)
            print(f"Tectonic Error:\n{result.stderr}", file=sys.stderr)
            raise Exception(f"LaTeX compilation failed. Check logs.")
        
        # Move file to final destination
        temp_pdf = tex_file_path.replace('.tex', '.pdf')
        if os.path.exists(temp_pdf):
            if os.path.exists(output_path):
                os.remove(output_path)
            os.rename(temp_pdf, output_path)
        else:
            raise Exception("PDF was not created by Tectonic despite exit code 0.")
        
        # Cleanup
        try:
            os.unlink(tex_file_path)
        except:
            pass
            
        return True
        
    except Exception as e:
        # This will be caught by Node.js spawn listener
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
        print(str(e), file=sys.stderr)
        sys.exit(1)